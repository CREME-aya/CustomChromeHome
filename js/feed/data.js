// ==========================================
// Feed Data / Cache
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;
const FeedParser = window.FeedParser;

let activeLoadGeneration = 0;
let activeControllers = [];

window.FeedData = {
    getStoredFeedUrls,
    loadFeedSources,
    parseFeedUrls,
    saveFeedUrls
};

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

function getStoredFeedUrls() {
    const feedUrls = parseFeedUrls(localStorage.getItem(FeedConstants.storageKeys.urls) || '');
    return feedUrls.length > 0 ? feedUrls : FeedConstants.defaultUrls;
}

function saveFeedUrls(feedUrls) {
    localStorage.setItem(FeedConstants.storageKeys.urls, feedUrls.join('\n'));
}

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

    // 設定変更後に古い通信が完了しても、最新画面を上書きさせない。
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

function abortActiveFeedRequests() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers = [];
}

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

function isRetryableFeedError(error) {
    return error.code === 'timeout' || Number(error.status) >= 500;
}

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

function getUserFeedErrorMessage(error) {
    if (error.code === 'timeout') return 'タイムアウトしました。';
    if (String(error.code || '').startsWith('http-')) return '配信元へ接続できませんでした。';
    if (error.code === 'parse') return 'フィード形式を解析できませんでした。';
    return 'フィードを取得できませんでした。';
}

function wait(durationMs) {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

function readFeedCache() {
    const cache = readJsonFromStorage(FeedConstants.storageKeys.cache, {});
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
}

function writeFeedCache(cache) {
    try {
        writeJsonToStorage(FeedConstants.storageKeys.cache, cache);
    } catch (error) {
        console.warn('Feed cache write failed');
    }
}

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
