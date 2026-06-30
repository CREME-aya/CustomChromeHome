// ==========================================
// Discover / RSS Feed Widget
// ==========================================
(function() {
const FeedCore = window.FeedCore;
const FeedConstants = window.FeedConstants;
const FeedData = window.FeedData;
const FeedParser = window.FeedParser;
const FeedRenderer = window.FeedRenderer;
const FeedSearch = window.FeedSearch;

// 取得結果はフィード単位で保持し、混合表示と部分失敗表示の両方へ利用する。
let currentFeedResults = [];
let currentArticles = [];
let favoriteArticles = readJsonFromStorage(FeedConstants.storageKeys.favorites, []);
let feedDisplayMode = FeedCore.normalizeDisplayMode(localStorage.getItem(FeedConstants.storageKeys.displayMode));
let lastActiveElement = null;

window.initFeed = initFeed;
window.initSearch = () => FeedSearch.initSearch(renderArticles);
window.getStoredFeedUrls = FeedData.getStoredFeedUrls;
window.loadFeed = loadFeed;

function initFeed() {
    const urlInput = document.getElementById('rss-url-input') || document.getElementById('feed-url-input');
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-rss-btn') || document.getElementById('save-url-btn');
    const retryBtn = document.getElementById('feed-retry-btn');

    if (urlInput) urlInput.value = FeedData.getStoredFeedUrls().join('\n');

    presetRss?.addEventListener('change', () => {
        const selectedUrl = presetRss.value;
        if (!selectedUrl || !urlInput) return;

        urlInput.value = selectedUrl;
        presetRss.value = '';
        FeedData.saveFeedUrls([selectedUrl]);
        loadFeed([selectedUrl]);
    });

    saveBtn?.addEventListener('click', () => {
        if (!urlInput) return;

        const feedUrls = FeedData.parseFeedUrls(urlInput.value);
        if (feedUrls.length === 0) {
            window.showNotification('有効なRSS / Atom URLを入力してください。', 'error');
            return;
        }

        FeedData.saveFeedUrls(feedUrls);
        loadFeed(feedUrls);
        window._toggleSidebar?.();
    });

    retryBtn?.addEventListener('click', () => loadFeed(FeedData.getStoredFeedUrls()));
    initFeedModeControls();
    initArticleModal();
}

function initArticleModal() {
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('article-modal');
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
}

function initFeedModeControls() {
    const mixedButton = document.getElementById('feed-mode-mixed');
    const splitButton = document.getElementById('feed-mode-split');
    if (!mixedButton || !splitButton) return;

    const applyMode = (mode) => {
        feedDisplayMode = FeedCore.normalizeDisplayMode(mode);
        localStorage.setItem(FeedConstants.storageKeys.displayMode, feedDisplayMode);
        updateFeedModeControls();
        renderArticles();
    };

    mixedButton.addEventListener('click', () => applyMode('mixed'));
    splitButton.addEventListener('click', () => applyMode('split'));
    updateFeedModeControls();
}

function updateFeedModeControls() {
    const mixedButton = document.getElementById('feed-mode-mixed');
    const splitButton = document.getElementById('feed-mode-split');

    [
        [mixedButton, feedDisplayMode === 'mixed'],
        [splitButton, feedDisplayMode === 'split']
    ].forEach(([button, isActive]) => {
        if (!button) return;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

async function loadFeed(feedUrlInput) {
    const requestedUrls = Array.isArray(feedUrlInput)
        ? FeedData.parseFeedUrls(feedUrlInput.join('\n'))
        : FeedData.parseFeedUrls(feedUrlInput);

    if (requestedUrls.length === 0) {
        applyFeedLoadResult({ status: 'empty', results: [], articles: [] });
        return;
    }

    setFeedStatus('loading', `${requestedUrls.length}件のフィードを読み込み中...`);
    const loadResult = await FeedData.loadFeedSources(requestedUrls);
    applyFeedLoadResult(loadResult);
}

function applyFeedLoadResult(loadResult) {
    if (loadResult.status === 'stale') return;

    if (loadResult.status === 'empty') {
        currentFeedResults = [];
        currentArticles = [];
        setFeedStatus('empty', 'フィードが設定されていません。');
        window.ApiDiagnostics?.report('feed', 'missing', 'フィードURL未設定');
        renderArticles();
        return;
    }

    currentFeedResults = loadResult.results;
    currentArticles = loadResult.articles;
    updateFeedLoadStatus(currentFeedResults);
    renderArticles();
}

function updateFeedLoadStatus(results) {
    const successfulResults = results.filter(result => ['success', 'stale'].includes(result.status));
    const failedResults = results.filter(result => result.status === 'error');
    const staleResults = results.filter(result => result.status === 'stale');

    if (successfulResults.length === 0) {
        setFeedStatus('error', 'フィードを取得できませんでした。再試行してください。', true);
        window.ApiDiagnostics?.report('feed', 'error', 'フィードを取得できませんでした');
        return;
    }

    if (failedResults.length > 0) {
        setFeedStatus(
            'warning',
            `${results.length}件中${failedResults.length}件の取得に失敗しました。成功した記事を表示しています。`
        );
        window.ApiDiagnostics?.report('feed', 'warning', `${results.length}件中${failedResults.length}件の取得に失敗`);
        return;
    }

    if (staleResults.length > 0) {
        setFeedStatus('warning', '前回取得した記事を含めて表示しています。');
        window.ApiDiagnostics?.report('feed', 'warning', '前回取得した記事を含めて表示');
        return;
    }

    setFeedStatus('success', `${currentArticles.length}件の記事を読み込みました。`);
    window.ApiDiagnostics?.report('feed', 'ok', `${currentArticles.length}件の記事を取得`);
}

function setFeedStatus(type, message, showRetry = false) {
    const retryButton = document.getElementById('feed-retry-btn');
    if (!retryButton) return;

    window.ApiUI?.setStatus('feed-status', message, {
        type,
        baseClass: 'feed-status'
    });
    retryButton.hidden = !showRetry;
}

function renderArticles() {
    const container = document.getElementById('feed-container');
    if (!container) return;

    container.replaceChildren();
    const selectedArticles = FeedSearch.getSelectedArticles(currentArticles, favoriteArticles);

    if (selectedArticles.length === 0) {
        container.appendChild(FeedRenderer.createEmptyState(FeedSearch.getEmptyMessage()));
        return;
    }

    if (feedDisplayMode === 'split') {
        FeedRenderer.renderSplitArticles(container, selectedArticles, currentFeedResults, getFeedActions());
    } else {
        FeedRenderer.renderMixedArticles(container, selectedArticles, getFeedActions());
    }
}

function getFeedActions() {
    return {
        favoriteArticles,
        onOpenArticle: openModal,
        onSummarizeArticle: summarizeArticle,
        onToggleFavorite(article) {
            toggleFavorite(article);
            renderArticles();
        }
    };
}

function summarizeArticle(article) {
    const geminiConfig = window.AiConstants?.apiKeys?.gemini || {};
    const apiKey = window.AiSettings?.getApiKey?.('gemini')
        || window.EnvConfig?.getStorageBackedValue(geminiConfig.storageKey, geminiConfig.envName)
        || localStorage.getItem(geminiConfig.storageKey)?.trim()
        || '';
    if (!apiKey) {
        window.showNotification('左上のメニューから Gemini API Key を設定してください。', 'error');
        return;
    }

    const prompt = `以下の記事を日本語で3行以内に要約してください。\nタイトル: ${article.title}\nリンク: ${article.link || 'なし'}\n概要: ${FeedParser.stripHtml(article.description) || 'なし'}`;
    window.sendToAI(prompt);
}

function toggleFavorite(article) {
    const index = favoriteArticles.findIndex(favorite => favorite.id === article.id);

    if (index === -1) {
        favoriteArticles.push(article);
    } else {
        favoriteArticles.splice(index, 1);
    }

    writeJsonToStorage(FeedConstants.storageKeys.favorites, favoriteArticles);
}

function openModal(article) {
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const link = document.getElementById('modal-link');
    const modal = document.getElementById('article-modal');
    if (!title || !body || !link || !modal) return;

    lastActiveElement = document.activeElement;

    title.textContent = article.title;
    body.replaceChildren(FeedParser.createSanitizedPreview(article.summaryHTML));

    const safeUrl = FeedParser.getSafeHttpUrl(article.url);
    link.href = safeUrl || '#';
    link.hidden = !safeUrl;
    link.rel = 'noopener noreferrer';
    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('close-modal-btn');
    closeBtn?.focus();
}

function closeModal() {
    const modal = document.getElementById('article-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    modal.classList.add('hidden');
    setTimeout(() => body.replaceChildren(), 300);

    if (lastActiveElement) {
        lastActiveElement.focus();
        lastActiveElement = null;
    }
}
})();
