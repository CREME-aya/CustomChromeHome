(function() {
    /**
     * フィード機能に関する設定定数
     */
    window.FeedConstants = Object.freeze({
        defaultUrl: 'https://qiita.com/popular-items/feed',
        defaultUrls: Object.freeze(['https://qiita.com/popular-items/feed']),
        /** ストレージ保存時のキー名 */
        storageKeys: Object.freeze({
            urls: 'custom_feed_url',
            favorites: 'custom_feed_favorites',
            readArticles: 'custom_feed_read_articles',
            displayMode: 'custom_feed_display_mode',
            cache: 'custom_feed_cache_v1'
        }),
        maxItems: 20,
        loadMoreIncrement: 20,
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
