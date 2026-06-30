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

test('FeedData.loadFeedSources は取得結果を正規化してキャッシュする', async () => {
    global.fetch = async (url) => {
        assert(String(url).includes(encodeURIComponent('https://example.com/custom.xml')), 'rss_url がAPI URLへ含まれていません');
        return {
            ok: true,
            json: async () => ({
                status: 'ok',
                feed: { title: 'Example Feed' },
                items: [{
                    title: 'Example Article',
                    link: 'https://example.com/a?utm_source=rss#frag',
                    pubDate: '2026-06-25T16:00:00Z',
                    description: 'Body'
                }]
            })
        };
    };

    const result = await window.FeedData.loadFeedSources(['https://example.com/custom.xml']);
    assertEqual(result.status, 'ready');
    assertEqual(result.results[0].status, 'success');
    assertEqual(result.articles[0].title, 'Example Article');
    assertEqual(result.articles[0].canonicalUrl, 'https://example.com/a');
    assert(storage.has(window.FeedConstants.storageKeys.cache), 'フィードキャッシュが保存されていません');
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
