// ==========================================
// Feed Search / Filter
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;

/**
 * 現在選択されているフィルターの種類（'all' または 'favorites'）
 * @type {string}
 */
let currentFilter = 'all';

/**
 * 現在入力されている検索クエリ
 * @type {string}
 */
let currentSearchQuery = '';

/**
 * 検索入力のデバウンス用タイマーID
 * @type {number|null}
 */
let searchDebounceTimer = null;

window.FeedSearch = {
    getEmptyMessage,
    getSelectedArticles,
    initSearch
};

/**
 * 検索フィールドとタブのイベントリスナーを初期化する
 * @param {Function} onChange - 絞り込み条件変更時に呼ばれるコールバック
 */
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

/**
 * 記事のフィルター状態を切り替え、UIの表示を更新する
 * @param {string} filter - 適用するフィルター（'all', 'favorites'）
 * @param {HTMLElement} activeTab - アクティブにするタブ要素
 * @param {HTMLElement} inactiveTab - 非アクティブにするタブ要素
 * @param {Function} onChange - 状態変更後に呼ばれるコールバック
 */
function setArticleFilter(filter, activeTab, inactiveTab, onChange) {
    currentFilter = filter;
    // CSS: .active (選択されたタブのスタイル)
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    activeTab.setAttribute('aria-pressed', 'true');
    inactiveTab.setAttribute('aria-pressed', 'false');
    onChange();
}

/**
 * 現在の検索条件・フィルターに基づき、対象となる記事を抽出する
 * @param {Array<Object>} articles - 全記事のリスト
 * @param {Array<Object>} favoriteArticles - お気に入りに登録されている記事のリスト
 * @returns {Array<Object>} 条件に一致した記事のリスト
 */
function getSelectedArticles(articles, favoriteArticles) {
    const favoriteIds = favoriteArticles.map(article => article.id);
    return FeedCore.filterArticles(articles, {
        query: currentSearchQuery,
        favoritesOnly: currentFilter === 'favorites',
        favoriteIds
    });
}

/**
 * 該当する記事がない場合に表示するメッセージを取得する
 * @returns {string} 空状態のメッセージ
 */
function getEmptyMessage() {
    if (currentFilter === 'favorites') return 'お気に入りの記事がありません。';
    if (currentSearchQuery) return '検索条件に一致する記事がありません。';
    return '表示できる記事がありません。';
}
})();
