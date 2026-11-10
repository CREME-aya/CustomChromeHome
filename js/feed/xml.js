// RSS / Atom XML の解析（描画時の HTML 安全処理は FeedParser が担当する）
(function() {
const NS = {
    atom: 'http://www.w3.org/2005/Atom',
    rss1: 'http://purl.org/rss/1.0/',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    content: 'http://purl.org/rss/1.0/modules/content/',
    media: 'http://search.yahoo.com/mrss/',
    dc: 'http://purl.org/dc/elements/1.1/'
};

function createParseError() {
    const error = new Error('フィードを解析できませんでした。');
    error.code = 'parse';
    return error;
}

function normalizeDateText(value) {
    return String(value || '').trim();
}

function selectAtomLink(links) {
    const available = links.filter(link => String(link.href || '').trim());
    const selected = available.find(link => !link.rel || link.rel === 'alternate') || available[0];
    return selected ? String(selected.href).trim() : '';
}

function isImageType(type) {
    return /^image\//i.test(String(type || '').trim());
}

/**
 * 音声・動画と明示された添付だけ除外する（Zenn の type="false" のような不正値は rss2json 同様に通す）
 * @param {string} type - enclosure の type 属性
 * @returns {boolean} サムネイル候補として残すか
 */
function isEnclosureThumbnailCandidate(type) {
    return !/^(?:audio|video)\//i.test(String(type || '').trim());
}

function pickThumbnail(thumbnails, mediaContents, enclosure) {
    return thumbnails.find(Boolean) || mediaContents.find(item => item.url && (item.medium === 'image' || isImageType(item.type)))?.url || enclosure.link || '';
}

function children(element, name, namespace) {
    return Array.from(element?.children || []).filter(child => child.localName === name && (child.namespaceURI || '') === namespace);
}

function child(element, name, namespace) {
    return children(element, name, namespace)[0];
}

function value(element) {
    return String(element?.textContent || '').trim();
}

/**
 * Atom の type="xhtml" 本文は子要素の HTML 文字列として取り出す（安全処理は FeedParser 側で行う）
 * @param {Element} element - Atom の content / summary 要素
 * @returns {string} 本文文字列
 */
function atomTextConstruct(element) {
    if (!element) return '';
    if (attribute(element, 'type') !== 'xhtml' || typeof globalThis.XMLSerializer !== 'function') return value(element);
    const serializer = new globalThis.XMLSerializer();
    const container = Array.from(element.children).find(node => node.localName === 'div') || element;
    return Array.from(container.childNodes).map(node => serializer.serializeToString(node)).join('').trim();
}

/**
 * BOM、Content-Type、XML 宣言の順で文字コード名を決める（RFC 7303 に合わせて BOM を優先）
 * @param {string} contentType - レスポンスの Content-Type
 * @param {string} head - 先頭バイトを latin1 として読んだ文字列
 * @returns {string} 文字コード名
 */
function detectXmlCharset(contentType, head) {
    const source = String(head || '');
    if (source.startsWith('\xEF\xBB\xBF')) return 'utf-8';
    if (source.startsWith('\xFE\xFF')) return 'utf-16be';
    if (source.startsWith('\xFF\xFE')) return 'utf-16le';
    const headerCharset = String(contentType || '').match(/charset\s*=\s*["']?([\w.:-]+)/i);
    if (headerCharset) return headerCharset[1].toLowerCase();
    const declared = source.match(/^\s*<\?xml[^>]*\bencoding\s*=\s*["']([\w.:-]+)["']/i);
    return declared ? declared[1].toLowerCase() : 'utf-8';
}

/**
 * フィードのバイト列を宣言された文字コードで文字列にする（Shift_JIS 等の日本語フィード対策）
 * @param {ArrayBuffer} buffer - レスポンス本文
 * @param {string} contentType - レスポンスの Content-Type
 * @returns {string} デコードした XML 文字列
 */
function decodeFeedBytes(buffer, contentType) {
    const bytes = new Uint8Array(buffer);
    const head = Array.from(bytes.subarray(0, 512), byte => String.fromCharCode(byte)).join('');
    try {
        return new TextDecoder(detectXmlCharset(contentType, head)).decode(bytes);
    } catch {
        return new TextDecoder('utf-8').decode(bytes);
    }
}

function text(element, name, namespace) {
    return value(child(element, name, namespace));
}

function attribute(element, name) {
    return String(element?.getAttribute(name) || '').trim();
}

function atomLink(element) {
    return selectAtomLink(children(element, 'link', NS.atom).map(link => ({ rel: attribute(link, 'rel'), href: attribute(link, 'href') })));
}

function mediaElements(element, name) {
    return [...children(element, name, NS.media), ...children(element, 'group', NS.media).flatMap(group => mediaElements(group, name))];
}

function parseEnclosure(element, namespace, isAtom) {
    const node = isAtom
        ? children(element, 'link', NS.atom).find(link => attribute(link, 'rel') === 'enclosure')
        : child(element, 'enclosure', namespace);
    const link = attribute(node, isAtom ? 'href' : 'url');
    const type = attribute(node, 'type');
    return link && isEnclosureThumbnailCandidate(type) ? { link, type } : {};
}

function parseItem(element, namespace, kind) {
    const isAtom = kind === 'atom';
    const enclosure = parseEnclosure(element, namespace, isAtom);
    const guidNode = child(element, 'guid', namespace);
    const about = attributeNS(element, NS.rdf, 'about');
    const published = isAtom ? text(element, 'published', namespace) : '';
    const updated = isAtom ? text(element, 'updated', namespace) : '';
    const content = isAtom ? atomTextConstruct(child(element, 'content', namespace)) : text(element, 'encoded', NS.content);
    const summaryNode = child(element, 'summary', namespace);
    const description = isAtom ? (summaryNode ? atomTextConstruct(summaryNode) : content) : text(element, 'description', namespace);
    let link = isAtom ? atomLink(element) : text(element, 'link', namespace);
    if (!link && kind === 'rdf') link = about;
    if (!link && kind === 'rss' && attribute(guidNode, 'isPermaLink').toLowerCase() !== 'false' && /^https?:\/\//i.test(value(guidNode))) link = value(guidNode);
    const thumbnails = mediaElements(element, 'thumbnail').map(node => attribute(node, 'url'));
    const mediaContents = mediaElements(element, 'content').map(node => ({ url: attribute(node, 'url'), medium: attribute(node, 'medium'), type: attribute(node, 'type') }));
    const result = {
        title: text(element, 'title', namespace), link,
        pubDate: normalizeDateText(isAtom ? published || updated : text(element, 'pubDate', namespace) || text(element, 'date', NS.dc)),
        description, content, thumbnail: pickThumbnail(thumbnails, mediaContents, enclosure), enclosure,
        author: isAtom ? text(child(element, 'author', namespace), 'name', namespace) : text(element, 'author', namespace) || text(element, 'creator', NS.dc),
        guid: isAtom ? text(element, 'id', namespace) : kind === 'rdf' ? about : value(guidNode),
        categories: children(element, 'category', namespace).map(node => isAtom ? attribute(node, 'term') : value(node))
    };
    if (isAtom) Object.assign(result, { published, updated });
    return result;
}

function attributeNS(element, namespace, name) {
    return String(element?.getAttributeNS(namespace, name) || '').trim();
}

function parseFeedXml(xmlText, DOMParserImpl = globalThis.DOMParser) {
    if (!String(xmlText || '').trim() || typeof DOMParserImpl !== 'function') throw createParseError();
    const document = new DOMParserImpl().parseFromString(xmlText, 'application/xml');
    const root = document.documentElement;
    if (!root || root.localName === 'parsererror' || document.getElementsByTagName('parsererror').length) throw createParseError();
    const kind = root.localName === 'rss' ? 'rss' : root.localName === 'feed' ? 'atom' : root.localName === 'RDF' ? 'rdf' : '';
    if (!kind || (kind === 'atom' && root.namespaceURI !== NS.atom)) throw createParseError();
    // RDF は RSS 1.0 / 0.90 で名前空間が異なるため、channel 要素の名前空間に合わせる
    const rdfChannel = kind === 'rdf' ? Array.from(root.children).find(node => node.localName === 'channel') : null;
    const namespace = kind === 'atom' ? NS.atom : kind === 'rdf' ? (rdfChannel?.namespaceURI || '') : '';
    const channel = kind === 'atom' ? root : kind === 'rdf' ? rdfChannel : child(root, 'channel', namespace);
    if (!channel) throw createParseError();
    const entries = children(kind === 'rdf' ? root : channel, kind === 'atom' ? 'entry' : 'item', namespace);
    return {
        status: 'ok',
        feed: {
            title: text(channel, 'title', namespace),
            link: kind === 'atom' ? atomLink(channel) : text(channel, 'link', namespace),
            description: text(channel, kind === 'atom' ? 'subtitle' : 'description', namespace),
            image: kind === 'atom' ? text(channel, 'logo', namespace) || text(channel, 'icon', namespace) : text(child(channel, 'image', namespace), 'url', namespace)
        },
        items: entries.map(entry => parseItem(entry, namespace, kind))
    };
}

window.FeedXml = { parseFeedXml, isEnclosureThumbnailCandidate, decodeFeedBytes, detectXmlCharset, selectAtomLink, normalizeDateText, pickThumbnail, isImageType, createParseError };
})();
