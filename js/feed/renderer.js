// ==========================================
// Feed DOM Renderer
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;

window.FeedRenderer = {
    createEmptyState,
    renderMixedArticles,
    renderSplitArticles
};

/**
 * フィードが空の場合の表示要素を作成する
 * @param {string} message - 表示するメッセージ
 * @returns {HTMLElement} 空状態を表すDOM要素
 */
function createEmptyState(message) {
    const emptyState = document.createElement('div');
    // CSS: .feed-empty-state (空状態のスタイル)
    emptyState.className = 'feed-empty-state';
    emptyState.textContent = message;
    return emptyState;
}

/**
 * 複数のフィード記事を混在表示（新着順など）でレンダリングする
 * @param {HTMLElement} container - 描画先のコンテナ要素
 * @param {Array<Object>} articles - 描画する記事の配列
 * @param {Object} actions - ユーザー操作時のコールバック群
 */
function renderMixedArticles(container, articles, actions, options = {}) {
    articles
        .slice(0, options.maxItems || FeedConstants.maxItems)
        .forEach(article => container.appendChild(createArticleElement(article, actions)));
}

/**
 * 記事をフィード（配信元）ごとに分割してレンダリングする
 * @param {HTMLElement} container - 描画先のコンテナ要素
 * @param {Array<Object>} articles - 描画する記事の配列
 * @param {Array<Object>} feedResults - フィードの取得結果一覧（エラー表示用）
 * @param {Object} actions - ユーザー操作時のコールバック群
 */
function renderSplitArticles(container, articles, feedResults, actions, options = {}) {
    const groups = FeedCore.groupArticlesBySource(articles);
    const maxTotalItems = options.maxTotalItems || FeedConstants.splitMaxTotalItems;
    const maxItemsPerFeed = options.maxItemsPerFeed || FeedConstants.splitMaxItemsPerFeed;
    let renderedCount = 0;

    groups.forEach((group) => {
        if (renderedCount >= maxTotalItems) return;

        const section = document.createElement('section');
        // CSS: .feed-group (配信元ごとのセクション)
        section.className = 'feed-group';

        const title = document.createElement('h3');
        // CSS: .feed-group-title (配信元タイトル)
        title.className = 'feed-group-title';
        title.textContent = group.feedTitle;
        section.appendChild(title);

        const itemContainer = document.createElement('div');
        // CSS: .feed-group-items (配信元ごとの記事リストコンテナ)
        itemContainer.className = 'feed-group-items';
        group.articles
            .slice(0, maxItemsPerFeed)
            .slice(0, maxTotalItems - renderedCount)
            .forEach((article) => {
                itemContainer.appendChild(createArticleElement(article, actions));
                renderedCount += 1;
            });

        section.appendChild(itemContainer);
        container.appendChild(section);
    });

    feedResults
        .filter(result => result.status === 'error')
        .forEach(result => container.appendChild(createFeedErrorElement(result)));
}

/**
 * 個別の記事要素（DOM）を作成する
 * @param {Object} article - 記事データ
 * @param {Object} actions - ユーザー操作時のコールバック群
 * @returns {HTMLElement} 記事のDOM要素
 */
function createArticleElement(article, actions) {
    const articleElement = document.createElement('article');
    // CSS: .item (記事アイテム全体のコンテナ)
    const isRead = actions.readArticleIds?.has(article.id);
    articleElement.className = `item${isRead ? ' read' : ''}`;

    const contentButton = document.createElement('button');
    // CSS: .item-content (記事を開くためのボタン領域)
    contentButton.className = 'item-content';
    contentButton.type = 'button';
    contentButton.setAttribute('aria-label', `${article.title}のプレビューを開く`);

    const title = document.createElement('h3');
    // CSS: .item-title (記事のタイトル)
    title.className = 'item-title';
    title.textContent = article.title;

    const meta = document.createElement('div');
    // CSS: .item-meta (公開日時や配信元などのメタ情報)
    meta.className = 'item-meta';
    meta.textContent = `${article.publishedLabel || article.dateStr || '日時不明'} ・ ${article.sourceFeedTitle || '不明なフィード'}`;

    contentButton.append(title, meta);
    contentButton.addEventListener('click', () => {
        actions.onMarkReadArticle?.(article);
        articleElement.classList.add('read');
        actions.onOpenArticle(article);
    });

    const itemActions = document.createElement('div');
    // CSS: .item-actions (要約やお気に入りなどのアクションボタンコンテナ)
    itemActions.className = 'item-actions';
    itemActions.append(createSummaryButton(article, actions), createFavoriteButton(article, actions));

    articleElement.append(contentButton, itemActions);
    return articleElement;
}

/**
 * AI要約ボタンを作成する
 * @param {Object} article - 記事データ
 * @param {Object} actions - ユーザー操作時のコールバック群
 * @returns {HTMLButtonElement} 要約ボタン要素
 */
function createSummaryButton(article, actions) {
    const button = document.createElement('button');
    // CSS: .ai-summary-btn (AI要約ボタン)
    button.className = 'ai-summary-btn';
    button.type = 'button';
    button.textContent = '要約';
    button.setAttribute('aria-label', `${article.title}をAIで要約`);
    button.addEventListener('click', () => actions.onSummarizeArticle(article));
    return button;
}

/**
 * お気に入り切り替えボタンを作成する
 * @param {Object} article - 記事データ
 * @param {Object} actions - ユーザー操作時のコールバック群
 * @returns {HTMLButtonElement} お気に入りボタン要素
 */
function createFavoriteButton(article, actions) {
    const isFavorite = actions.favoriteArticles.some(favorite => favorite.id === article.id);
    const button = document.createElement('button');
    // CSS: .fav-btn, .fav-btn.active (お気に入りボタン、アクティブ状態)
    button.className = `fav-btn${isFavorite ? ' active' : ''}`;
    button.type = 'button';
    button.textContent = isFavorite ? '★' : '☆';
    button.setAttribute('aria-label', isFavorite ? 'お気に入りから削除' : 'お気に入りに追加');
    button.setAttribute('aria-pressed', String(isFavorite));
    button.addEventListener('click', () => actions.onToggleFavorite(article));
    return button;
}

/**
 * フィード取得エラーの表示要素を作成する
 * @param {Object} result - フィード取得結果（エラー情報含む）
 * @returns {HTMLElement} エラー表示のDOM要素
 */
function createFeedErrorElement(result) {
    const error = document.createElement('div');
    // CSS: .feed-source-error (エラー表示コンテナ)
    error.className = 'feed-source-error';

    const icon = document.createElement('span');
    // CSS: .error-icon (エラーアイコン)
    icon.className = 'error-icon';
    icon.textContent = '⚠️';
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('strong');
    title.textContent = result.feedTitle;

    const message = document.createElement('span');
    message.textContent = result.errorMessage;

    error.append(icon, title, message);
    return error;
}
})();
