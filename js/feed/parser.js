// ==========================================
// Feed Parser / Sanitizer
// ==========================================
(function() {
window.FeedParser = {
    createSanitizedPreview,
    getFeedHostname,
    getSafeHttpUrl,
    stripHtml
};

/**
 * HTML文字列をサニタイズしてプレビュー用のDOMツリー（DocumentFragment）を作成する
 * @param {string} html - 元のHTML文字列
 * @returns {DocumentFragment} サニタイズされたDOMツリー
 */
function createSanitizedPreview(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '<p>プレビュー内容がありません。</p>');
    sanitizeNodeTree(template.content);
    return template.content;
}

/**
 * 指定したDOMツリー内の危険な要素や属性を再帰的に取り除く
 * @param {DocumentFragment|Element} root - サニタイズ対象のルートノード
 */
function sanitizeNodeTree(root) {
    const allowedTags = new Set([
        'P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I',
        'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'A', 'IMG'
    ]);

    const discardTags = new Set([
        'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'CANVAS', 'VIDEO', 'AUDIO'
    ]);

    Array.from(root.querySelectorAll('*')).forEach((element) => {
        const tagName = element.tagName;
        if (discardTags.has(tagName)) {
            element.remove();
            return;
        }

        if (!allowedTags.has(tagName)) {
            element.replaceWith(...element.childNodes);
            return;
        }

        const originalHref = element.getAttribute('href');
        const originalSource = element.getAttribute('src');
        Array.from(element.attributes).forEach(attribute => element.removeAttribute(attribute.name));

        if (tagName === 'A') {
            const safeHref = getSafeHttpUrl(originalHref);
            if (safeHref) {
                element.href = safeHref;
                element.target = '_blank';
                element.rel = 'noopener noreferrer';
            }
        }

        if (tagName === 'IMG') {
            const safeSource = getSafeHttpUrl(originalSource);
            if (safeSource) {
                element.src = safeSource;
                element.alt = '';
                element.loading = 'lazy';
            } else {
                element.remove();
            }
        }
    });
}

/**
 * 指定された文字列が安全なHTTP(S) URLであるか検証し、正規化して返す
 * @param {string} value - 検証するURL文字列
 * @returns {string} 安全なURL。無効な場合は空文字列を返す。
 */
function getSafeHttpUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (error) {
        return '';
    }
}

/**
 * フィードのURLから表示用のホスト名（www.を除去したもの）を取得する
 * @param {string} feedUrl - フィードのURL
 * @returns {string} ホスト名。取得できない場合は空文字列。
 */
function getFeedHostname(feedUrl) {
    try {
        return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch (error) {
        return '';
    }
}

/**
 * HTML文字列からテキストコンテンツのみを抽出する（タグの除去）
 * @param {string} value - 元のHTML文字列
 * @returns {string} タグが除去されたプレーンテキスト
 */
function stripHtml(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    return template.content.textContent.trim();
}
})();
