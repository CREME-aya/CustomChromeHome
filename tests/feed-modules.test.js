global.window = global;

const storage = new Map();
global.localStorage = {
    getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
        storage.set(key, String(value));
    },
    removeItem(key) {
        storage.delete(key);
    }
};

global.readJsonFromStorage = (key, fallback) => {
    const value = global.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
};
global.writeJsonToStorage = (key, value) => {
    global.localStorage.setItem(key, JSON.stringify(value));
};

require('../js/feed-core.js');
require('../js/feed/constants.js');
require('../js/feed/parser.js');
require('../js/feed/xml.js');
require('../js/feed/data.js');

let failed = 0;
const tests = [];

function test(name, callback) {
    tests.push({ name, callback });
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('FeedXml は Atom リンクと日付を正規化する', () => {
    assertEqual(window.FeedXml.selectAtomLink([{ rel: 'self', href: 'self' }, { rel: 'alternate', href: 'alternate' }]), 'alternate');
    assertEqual(window.FeedXml.selectAtomLink([{ rel: 'self', href: 'first' }, { href: '' }]), 'first');
    assertEqual(window.FeedXml.selectAtomLink([]), '');
    assertEqual(window.FeedXml.normalizeDateText(' 2026-01-01 '), '2026-01-01');
});

test('FeedXml は Content-Type と XML 宣言から文字コードを決める', () => {
    assertEqual(window.FeedXml.detectXmlCharset('application/rss+xml; charset=EUC-JP', '<?xml version="1.0" encoding="UTF-8"?>'), 'euc-jp');
    assertEqual(window.FeedXml.detectXmlCharset('text/xml', '<?xml version="1.0" encoding="Shift_JIS"?><rss/>'), 'shift_jis');
    assertEqual(window.FeedXml.detectXmlCharset('', '<rss/>'), 'utf-8');
    assertEqual(window.FeedXml.detectXmlCharset('text/xml; charset=UTF-8', '\xFF\xFE<\x00'), 'utf-16le');
    const sjisBytes = Uint8Array.from([0x3c, 0x3f, 0x78, 0x6d, 0x6c, 0x20, 0x65, 0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x3d, 0x22, 0x53, 0x68, 0x69, 0x66, 0x74, 0x5f, 0x4a, 0x49, 0x53, 0x22, 0x3f, 0x3e, 0x82, 0xa0]);
    assert(window.FeedXml.decodeFeedBytes(sjisBytes.buffer, 'text/xml').endsWith('\u3042'), 'Shift_JIS をデコードできません');
    assertEqual(window.FeedXml.decodeFeedBytes(Uint8Array.from([0xe3, 0x81, 0x82]).buffer, 'text/xml; charset=unknown-x'), '\u3042');
});

test('FeedXml は音声・動画以外の enclosure をサムネイル候補に残す', () => {
    assertEqual(window.FeedXml.isEnclosureThumbnailCandidate('false'), true);
    assertEqual(window.FeedXml.isEnclosureThumbnailCandidate(''), true);
    assertEqual(window.FeedXml.isEnclosureThumbnailCandidate('image/png'), true);
    assertEqual(window.FeedXml.isEnclosureThumbnailCandidate('audio/mpeg'), false);
    assertEqual(window.FeedXml.isEnclosureThumbnailCandidate('video/mp4'), false);
    assertEqual(window.FeedXml.pickThumbnail([], [], { link: 'https://res.cloudinary.com/a.png?_a=1', type: 'false' }), 'https://res.cloudinary.com/a.png?_a=1');
});

test('FeedXml は空の XML と DOMParser 不在を解析エラーにする', () => {
    for (const source of ['', '<rss/>']) {
        try {
            window.FeedXml.parseFeedXml(source, null);
            throw new Error('解析エラーがありません');
        } catch (error) {
            assertEqual(error.code, 'parse');
        }
    }
});

test('FeedData.parseFeedUrls はHTTP URLだけを重複排除して返す', () => {
    const urls = window.FeedData.parseFeedUrls([
        'https://example.com/rss',
        'javascript:alert(1)',
        'https://example.com/rss',
        'http://example.com/feed'
    ].join('\n'));

    assertEqual(urls.length, 2);
    assertEqual(urls[0], 'https://example.com/rss');
    assertEqual(urls[1], 'http://example.com/feed');
});

test('FeedData.getStoredFeedUrls は保存値がなければ既定値を返す', () => {
    storage.delete(window.FeedConstants.storageKeys.urls);
    assertEqual(window.FeedData.getStoredFeedUrls()[0], window.FeedConstants.defaultUrls[0]);

    window.FeedData.saveFeedUrls(['https://example.com/custom.xml']);
    assertEqual(window.FeedData.getStoredFeedUrls()[0], 'https://example.com/custom.xml');
});

test('FeedData.parseOpmlFeedUrls はOPMLからHTTP URLだけを重複排除する', () => {
    const urls = window.FeedData.parseOpmlFeedUrls([
        '<?xml version="1.0"?>',
        '<opml version="2.0"><body>',
        '<outline text="Example" xmlUrl="https://example.com/rss.xml" />',
        '<outline text="Duplicate" xmlUrl="https://example.com/rss.xml" />',
        '<outline text="Unsafe" xmlUrl="javascript:alert(1)" />',
        '</body></opml>'
    ].join(''));

    assertEqual(urls.length, 1);
    assertEqual(urls[0], 'https://example.com/rss.xml');
});

test('FeedData.buildOpmlDocument は保存フィードを書き出せる', () => {
    const opml = window.FeedData.buildOpmlDocument(['https://example.com/rss.xml']);

    assert(opml.includes('<opml version="2.0">'), 'OPMLヘッダーがありません');
    assert(opml.includes('xmlUrl="https://example.com/rss.xml"'), 'フィードURLが書き出されていません');
});

test('FeedData.loadFeedSources は取得結果を正規化してキャッシュする', async () => {
    const originalParser = window.FeedXml.parseFeedXml;
    window.FeedXml.parseFeedXml = () => ({
        status: 'ok', feed: { title: 'Example Feed' },
        items: [{ title: 'Example Article', link: 'https://example.com/a?utm_source=rss#frag', pubDate: '2026-06-25T16:00:00Z', description: 'Body' }]
    });
    global.fetch = async (url) => {
        assertEqual(url, 'https://example.com/custom.xml');
        return { ok: true, text: async () => '<rss/>' };
    };

    const result = await window.FeedData.loadFeedSources(['https://example.com/custom.xml']);
    assertEqual(result.status, 'ready');
    assertEqual(result.results[0].status, 'success');
    assertEqual(result.articles[0].title, 'Example Article');
    assertEqual(result.articles[0].canonicalUrl, 'https://example.com/a');
    assert(storage.has(window.FeedConstants.storageKeys.cache), 'フィードキャッシュが保存されていません');
    window.FeedXml.parseFeedXml = originalParser;
});

test('FeedData.loadFeedSources は取得失敗時に有効なキャッシュを stale として返す', async () => {
    global.fetch = async () => ({ ok: false, status: 503 });

    const result = await window.FeedData.loadFeedSources(['https://example.com/custom.xml']);
    assertEqual(result.status, 'ready');
    assertEqual(result.results[0].status, 'stale');
    assertEqual(result.articles[0].title, 'Example Article');
});

(async function run() {
    for (const { name, callback } of tests) {
        try {
            await callback();
            console.log(`PASS ${name}`);
        } catch (error) {
            failed += 1;
            console.error(`FAIL ${name}: ${error.message}`);
        }
    }

    if (failed > 0) process.exit(1);
})();
