// ==========================================
// Feed Data / Cache
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;
const FeedParser = window.FeedParser;

/**
 * 現在実行中のフィード読み込みの世代（非同期処理の競合・上書き防止用）
 * @type {number}
 */
let activeLoadGeneration = 0;

/**
 * 中断可能な進行中のフェッチリクエストのコントローラー一覧
 * @type {AbortController[]}
 */
let activeControllers = [];

window.FeedData = {
    buildOpmlDocument,
    getStoredFeedUrls,
    loadFeedSources,
    parseOpmlFeedUrls,
    parseFeedUrls,
    saveFeedUrls
};

/**
 * 文字列から有効なフィードURLのリストを抽出して一意にする
 * @param {string} value - 改行区切りのURL文字列
 * @returns {string[]} 重複のない有効なURLの配列
 */
function parseFeedUrls(value) {
    const uniqueUrls = new Set();

    String(value || '')
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean)
        .forEach((url) => {
            const safeUrl = FeedParser.getSafeHttpUrl(url);
            if (safeUrl) uniqueUrls.add(safeUrl);
        });

    return Array.from(uniqueUrls);
}

/**
 * ストレージに保存されているフィードURL一覧を取得する
 * 未設定の場合はデフォルトのURL一覧を返す
 * @returns {string[]} フィードURLの配列
 */
function getStoredFeedUrls() {
    const feedUrls = parseFeedUrls(localStorage.getItem(FeedConstants.storageKeys.urls) || '');
    return feedUrls.length > 0 ? feedUrls : FeedConstants.defaultUrls;
}

/**
 * フィードURL一覧をストレージに保存する
 * @param {string[]} feedUrls - 保存するURLの配列
 */
function saveFeedUrls(feedUrls) {
    localStorage.setItem(FeedConstants.storageKeys.urls, feedUrls.join('\n'));
}

/**
 * OPML文字列からHTTP(S)フィードURLを抽出する
 * @param {string} opmlText - OPML XML文字列
 * @returns {string[]} 重複のないフィードURL
 */
function parseOpmlFeedUrls(opmlText) {
    const urls = new Set();
    const source = String(opmlText || '');

    if (typeof DOMParser !== 'undefined') {
        const document = new DOMParser().parseFromString(source, 'application/xml');
        Array.from(document.querySelectorAll('outline[xmlUrl], outline[xmlurl]')).forEach((outline) => {
            const safeUrl = FeedParser.getSafeHttpUrl(outline.getAttribute('xmlUrl') || outline.getAttribute('xmlurl'));
            if (safeUrl) urls.add(safeUrl);
        });
    }

    for (const match of source.matchAll(/\bxmlUrl\s*=\s*["']([^"']+)["']/gi)) {
        const safeUrl = FeedParser.getSafeHttpUrl(decodeXml(match[1]));
        if (safeUrl) urls.add(safeUrl);
    }

    return Array.from(urls);
}

/**
 * 現在のフィードURL一覧を書き出すOPML文字列を生成する
 * @param {string[]} feedUrls - 書き出すフィードURL
 * @returns {string} OPML XML文字列
 */
function buildOpmlDocument(feedUrls) {
    const outlines = parseFeedUrls(feedUrls.join('\n'))
        .map((feedUrl) => {
            const title = FeedParser.getFeedHostname(feedUrl) || feedUrl;
            return `    <outline type="rss" text="${escapeXml(title)}" title="${escapeXml(title)}" xmlUrl="${escapeXml(feedUrl)}" />`;
        })
        .join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<opml version="2.0">',
        '  <head>',
        '    <title>Nexus Dash Feeds</title>',
        '  </head>',
        '  <body>',
        outlines,
        '  </body>',
        '</opml>'
    ].join('\n');
}

/**
 * XML属性値をエスケープする
 * @param {string} value - エスケープ対象
 * @returns {string} XML属性として安全な文字列
 */
function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * XML属性値の主要なエンティティを戻す
 * @param {string} value - デコード対象
 * @returns {string} デコード後の文字列
 */
function decodeXml(value) {
    return String(value || '')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * 指定されたURLリストからフィードを取得し、結果をまとめる
 * @param {string|string[]} feedUrlInput - フィードURLのリストまたは改行区切り文字列
 * @returns {Promise<Object>} フィード取得の総合結果
 */
async function loadFeedSources(feedUrlInput) {
    const feedUrls = Array.isArray(feedUrlInput)
        ? parseFeedUrls(feedUrlInput.join('\n'))
        : parseFeedUrls(feedUrlInput);

    activeLoadGeneration += 1;
    const loadGeneration = activeLoadGeneration;
    abortActiveFeedRequests();

    if (feedUrls.length === 0) {
        return {
            status: 'empty',
            feedUrls,
            results: [],
            articles: []
        };
    }

    const tasks = feedUrls.map((feedUrl, sourceOrder) => () => loadSingleFeed(feedUrl, sourceOrder));
    const results = await runWithConcurrency(tasks, FeedConstants.maxConcurrentRequests);

    // 古い世代の通信が完了しても、最新の画面状態を上書きしないようにする
    if (loadGeneration !== activeLoadGeneration) {
        return { status: 'stale', feedUrls, results: [], articles: [] };
    }

    const cache = readFeedCache();
    const feedResults = results.map((result, index) => {
        if (result.status === 'success') {
            writeFeedCacheEntry(cache, result);
            return result;
        }

        const cachedResult = getCachedFeedResult(cache, feedUrls[index], index);
        return cachedResult || result;
    });
    writeFeedCache(cache);

    return {
        status: 'ready',
        feedUrls,
        results: feedResults,
        articles: FeedCore.sortArticles(
            FeedCore.deduplicateArticles(
                feedResults.flatMap(result => result.articles || [])
            )
        )
    };
}

/**
 * 進行中のすべてのフィード取得リクエストを中断する
 */
function abortActiveFeedRequests() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers = [];
}

/**
 * 複数の非同期タスクを指定した並行数で実行する
 * @param {Function[]} tasks - 実行するタスク関数の配列
 * @param {number} concurrency - 最大並行実行数
 * @returns {Promise<Array>} 各タスクの実行結果を格納した配列
 */
async function runWithConcurrency(tasks, concurrency) {
    const results = new Array(tasks.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < tasks.length) {
            const taskIndex = nextIndex;
            nextIndex += 1;

            try {
                results[taskIndex] = await tasks[taskIndex]();
            } catch (error) {
                results[taskIndex] = createFeedErrorResult('', taskIndex, error);
            }
        }
    }

    const workerCount = Math.min(concurrency, tasks.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}

/**
 * 単一のフィードURLからデータを取得・解析し、再試行処理を行う
 * @param {string} feedUrl - 取得対象のフィードURL
 * @param {number} sourceOrder - URLリストにおけるインデックス
 * @returns {Promise<Object>} フィードの解析結果またはエラー結果
 */
async function loadSingleFeed(feedUrl, sourceOrder) {
    const feedKey = FeedCore.createFeedKey(feedUrl);
    const feedHostname = FeedParser.getFeedHostname(feedUrl);
    const startedAt = Date.now();

    for (let attempt = 0; attempt <= FeedConstants.maxRetries; attempt += 1) {
        try {
            const data = await fetchFeedData(feedUrl);
            const feedTitle = String(data.feed?.title || feedHostname);
            const articles = (data.items || []).map((item, itemOrder) => FeedCore.normalizeFeedItem(item, {
                feedUrl,
                feedKey,
                feedTitle,
                feedHostname,
                sourceOrder,
                itemOrder
            }));

            console.info('Feed load succeeded', {
                feed: feedHostname,
                durationMs: Date.now() - startedAt,
                articleCount: articles.length
            });

            return {
                feedUrl,
                feedKey,
                feedTitle,
                sourceOrder,
                status: 'success',
                articles,
                errorCode: null,
                errorMessage: null,
                fetchedAt: Date.now()
            };
        } catch (error) {
            const shouldRetry = attempt < FeedConstants.maxRetries && isRetryableFeedError(error);
            if (shouldRetry) {
                await wait(FeedConstants.retryDelayMs + Math.floor(Math.random() * FeedConstants.retryDelayMs));
                continue;
            }

            console.warn('Feed load failed', {
                feed: feedHostname,
                durationMs: Date.now() - startedAt,
                code: error.code || 'unknown'
            });
            return createFeedErrorResult(feedUrl, sourceOrder, error);
        }
    }

    return createFeedErrorResult(feedUrl, sourceOrder, new Error('フィードの取得に失敗しました。'));
}

/**
 * rss2json API を経由してフィードのJSONデータを取得する
 * @param {string} feedUrl - 対象のRSS/AtomフィードURL
 * @returns {Promise<Object>} APIから返されたJSONデータ
 */
async function fetchFeedData(feedUrl) {
    const controller = new AbortController();
    activeControllers.push(controller);
    const timeoutId = setTimeout(() => controller.abort('timeout'), FeedConstants.requestTimeoutMs);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

    try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}`);
            error.code = `http-${response.status}`;
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        if (data.status !== 'ok') {
            const error = new Error('フィードを解析できませんでした。');
            error.code = 'parse';
            throw error;
        }

        return data;
    } catch (error) {
        if (controller.signal.aborted) {
            if (controller.signal.reason === 'timeout') {
                const timeoutError = new Error('フィードの取得がタイムアウトしました。');
                timeoutError.code = 'timeout';
                throw timeoutError;
            }
            const abortError = new Error('フィードの取得が中断されました。');
            abortError.code = 'abort';
            throw abortError;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
        activeControllers = activeControllers.filter(active => active !== controller);
    }
}

/**
 * 発生したエラーが再試行すべき一時的なものか判定する
 * @param {Error} error - 検査対象のエラー
 * @returns {boolean} 再試行可能ならtrue
 */
function isRetryableFeedError(error) {
    return error.code === 'timeout' || Number(error.status) >= 500;
}

/**
 * フィード取得失敗時の標準化されたエラー結果オブジェクトを生成する
 * @param {string} feedUrl - 対象のURL
 * @param {number} sourceOrder - URLリストにおけるインデックス
 * @param {Error} error - 発生したエラー
 * @returns {Object} エラー用の結果オブジェクト
 */
function createFeedErrorResult(feedUrl, sourceOrder, error) {
    return {
        feedUrl,
        feedKey: FeedCore.createFeedKey(feedUrl),
        feedTitle: FeedParser.getFeedHostname(feedUrl) || '不明なフィード',
        sourceOrder,
        status: 'error',
        articles: [],
        errorCode: error.code || 'unknown',
        errorMessage: getUserFeedErrorMessage(error),
        fetchedAt: Date.now()
    };
}

/**
 * ユーザー向けに表示するエラーメッセージを生成する
 * @param {Error} error - 発生したエラー
 * @returns {string} ユーザー向けエラーメッセージ
 */
function getUserFeedErrorMessage(error) {
    if (error.code === 'timeout') return 'タイムアウトしました。';
    if (String(error.code || '').startsWith('http-')) return '配信元へ接続できませんでした。';
    if (error.code === 'parse') return 'フィード形式を解析できませんでした。';
    return 'フィードを取得できませんでした。';
}

/**
 * 指定したミリ秒だけ待機する
 * @param {number} durationMs - 待機するミリ秒数
 * @returns {Promise<void>}
 */
function wait(durationMs) {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

/**
 * ストレージからフィードのキャッシュデータを読み込む
 * @returns {Object} キャッシュの辞書オブジェクト
 */
function readFeedCache() {
    const cache = readJsonFromStorage(FeedConstants.storageKeys.cache, {});
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
}

/**
 * ストレージへフィードのキャッシュデータを書き込む
 * @param {Object} cache - 保存するキャッシュデータ
 */
function writeFeedCache(cache) {
    try {
        writeJsonToStorage(FeedConstants.storageKeys.cache, cache);
    } catch (error) {
        console.warn('Feed cache write failed');
    }
}

/**
 * キャッシュに単一のフィード結果を登録する
 * @param {Object} cache - キャッシュの辞書
 * @param {Object} result - 保存するフィード結果
 */
function writeFeedCacheEntry(cache, result) {
    cache[result.feedKey] = {
        feedTitle: result.feedTitle,
        fetchedAt: result.fetchedAt,
        articles: result.articles.slice(0, FeedConstants.cacheItemsPerFeed).map(article => ({
            ...article,
            sourceFeedUrl: ''
        }))
    };
}

/**
 * キャッシュからフィード結果を取得する（有効期限内の場合のみ）
 * @param {Object} cache - キャッシュの辞書
 * @param {string} feedUrl - 検索対象のフィードURL
 * @param {number} sourceOrder - URLリストにおけるインデックス
 * @returns {Object|null} キャッシュされた結果、もしくはnull
 */
function getCachedFeedResult(cache, feedUrl, sourceOrder) {
    const feedKey = FeedCore.createFeedKey(feedUrl);
    const entry = cache[feedKey];
    if (!entry || Date.now() - entry.fetchedAt > FeedConstants.cacheTtlMs) return null;

    return {
        feedUrl,
        feedKey,
        feedTitle: entry.feedTitle || FeedParser.getFeedHostname(feedUrl),
        sourceOrder,
        status: 'stale',
        articles: (entry.articles || []).map(article => ({
            ...article,
            sourceFeedUrl: feedUrl,
            sourceOrder
        })),
        errorCode: null,
        errorMessage: null,
        fetchedAt: entry.fetchedAt
    };
}
})();
