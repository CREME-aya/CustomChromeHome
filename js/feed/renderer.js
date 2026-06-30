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

function createEmptyState(message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'feed-empty-state';
    emptyState.textContent = message;
    return emptyState;
}

function renderMixedArticles(container, articles, actions) {
    articles
        .slice(0, FeedConstants.maxItems)
        .forEach(article => container.appendChild(createArticleElement(article, actions)));
}

function renderSplitArticles(container, articles, feedResults, actions) {
    const groups = FeedCore.groupArticlesBySource(articles);
    let renderedCount = 0;

    groups.forEach((group) => {
        if (renderedCount >= FeedConstants.splitMaxTotalItems) return;

        const section = document.createElement('section');
        section.className = 'feed-group';

        const title = document.createElement('h3');
        title.className = 'feed-group-title';
        title.textContent = group.feedTitle;
        section.appendChild(title);

        const itemContainer = document.createElement('div');
        itemContainer.className = 'feed-group-items';
        group.articles
            .slice(0, FeedConstants.splitMaxItemsPerFeed)
            .slice(0, FeedConstants.splitMaxTotalItems - renderedCount)
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

function createArticleElement(article, actions) {
    const articleElement = document.createElement('article');
    articleElement.className = 'item';

    const contentButton = document.createElement('button');
    contentButton.className = 'item-content';
    contentButton.type = 'button';
    contentButton.setAttribute('aria-label', `${article.title}のプレビューを開く`);

    const title = document.createElement('h3');
    title.className = 'item-title';
    title.textContent = article.title;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = `${article.publishedLabel || article.dateStr || '日時不明'} ・ ${article.sourceFeedTitle || '不明なフィード'}`;

    contentButton.append(title, meta);
    contentButton.addEventListener('click', () => actions.onOpenArticle(article));

    const itemActions = document.createElement('div');
    itemActions.className = 'item-actions';
    itemActions.append(createSummaryButton(article, actions), createFavoriteButton(article, actions));

    articleElement.append(contentButton, itemActions);
    return articleElement;
}

function createSummaryButton(article, actions) {
    const button = document.createElement('button');
    button.className = 'ai-summary-btn';
    button.type = 'button';
    button.textContent = '要約';
    button.setAttribute('aria-label', `${article.title}をAIで要約`);
    button.addEventListener('click', () => actions.onSummarizeArticle(article));
    return button;
}

function createFavoriteButton(article, actions) {
    const isFavorite = actions.favoriteArticles.some(favorite => favorite.id === article.id);
    const button = document.createElement('button');
    button.className = `fav-btn${isFavorite ? ' active' : ''}`;
    button.type = 'button';
    button.textContent = isFavorite ? '★' : '☆';
    button.setAttribute('aria-label', isFavorite ? 'お気に入りから削除' : 'お気に入りに追加');
    button.setAttribute('aria-pressed', String(isFavorite));
    button.addEventListener('click', () => actions.onToggleFavorite(article));
    return button;
}

function createFeedErrorElement(result) {
    const error = document.createElement('div');
    error.className = 'feed-source-error';

    const icon = document.createElement('span');
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
