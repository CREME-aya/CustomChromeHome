(function() {
    window.FeedConstants = Object.freeze({
        defaultUrl: 'https://qiita.com/popular-items/feed',
        defaultUrls: Object.freeze(['https://qiita.com/popular-items/feed']),
        storageKeys: Object.freeze({
            urls: 'custom_feed_url',
            favorites: 'custom_feed_favorites',
            displayMode: 'custom_feed_display_mode',
            cache: 'custom_feed_cache_v1'
        }),
        maxItems: 20,
        splitMaxItemsPerFeed: 10,
        splitMaxTotalItems: 40,
        requestTimeoutMs: 10000,
        maxConcurrentRequests: 4,
        maxRetries: 1,
        retryDelayMs: 400,
        searchDebounceMs: 150,
        cacheTtlMs: 24 * 60 * 60 * 1000,
        cacheItemsPerFeed: 20
    });
})();
