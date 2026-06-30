// ==========================================
// Feed Search / Filter
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;

let currentFilter = 'all';
let currentSearchQuery = '';
let searchDebounceTimer = null;

window.FeedSearch = {
    getEmptyMessage,
    getSelectedArticles,
    initSearch
};

function initSearch(onChange) {
    const searchInput = document.getElementById('search-input');
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favorites');
    if (!searchInput || !tabAll || !tabFavs) return;

    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentSearchQuery = event.target.value;
            onChange();
        }, FeedConstants.searchDebounceMs);
    });

    tabAll.addEventListener('click', () => setArticleFilter('all', tabAll, tabFavs, onChange));
    tabFavs.addEventListener('click', () => setArticleFilter('favorites', tabFavs, tabAll, onChange));
}

function setArticleFilter(filter, activeTab, inactiveTab, onChange) {
    currentFilter = filter;
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    activeTab.setAttribute('aria-pressed', 'true');
    inactiveTab.setAttribute('aria-pressed', 'false');
    onChange();
}

function getSelectedArticles(articles, favoriteArticles) {
    const favoriteIds = favoriteArticles.map(article => article.id);
    return FeedCore.filterArticles(articles, {
        query: currentSearchQuery,
        favoritesOnly: currentFilter === 'favorites',
        favoriteIds
    });
}

function getEmptyMessage() {
    if (currentFilter === 'favorites') return 'お気に入りの記事がありません。';
    if (currentSearchQuery) return '検索条件に一致する記事がありません。';
    return '表示できる記事がありません。';
}
})();
