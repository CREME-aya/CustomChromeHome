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
const storedReadArticleIds = readJsonFromStorage(FeedConstants.storageKeys.readArticles, []);
let readArticleIds = new Set(Array.isArray(storedReadArticleIds) ? storedReadArticleIds : []);
let feedDisplayMode = FeedCore.normalizeDisplayMode(localStorage.getItem(FeedConstants.storageKeys.displayMode));
let visibleArticleLimit = getDefaultArticleLimit();
let lastActiveElement = null;

window.initFeed = initFeed;
window.initSearch = () => FeedSearch.initSearch(() => {
    resetVisibleArticleLimit();
    renderArticles();
});
window.getStoredFeedUrls = FeedData.getStoredFeedUrls;
window.loadFeed = loadFeed;

/**
 * フィード機能の初期化を行う
 */
function initFeed() {
    const urlInput = document.getElementById('rss-url-input') || document.getElementById('feed-url-input');
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-rss-btn') || document.getElementById('save-url-btn');
    const retryBtn = document.getElementById('feed-retry-btn');
    const opmlInput = document.getElementById('opml-import-input');
    const opmlExportBtn = document.getElementById('opml-export-btn');

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
    opmlInput?.addEventListener('change', () => importOpmlFile(opmlInput, urlInput));
    opmlExportBtn?.addEventListener('click', exportOpmlFile);
    initFeedModeControls();
    initArticleModal();
}

/**
 * 記事モーダルの初期化を行う
 */
function initArticleModal() {
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('article-modal');
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
}

/**
 * フィードの表示モード切り替えコントロールを初期化する
 */
function initFeedModeControls() {
    const mixedButton = document.getElementById('feed-mode-mixed');
    const splitButton = document.getElementById('feed-mode-split');
    if (!mixedButton || !splitButton) return;

    const applyMode = (mode) => {
        feedDisplayMode = FeedCore.normalizeDisplayMode(mode);
        localStorage.setItem(FeedConstants.storageKeys.displayMode, feedDisplayMode);
        resetVisibleArticleLimit();
        updateFeedModeControls();
        renderArticles();
    };

    mixedButton.addEventListener('click', () => applyMode('mixed'));
    splitButton.addEventListener('click', () => applyMode('split'));
    updateFeedModeControls();
}

/**
 * フィードの表示モードコントロールのUI状態を更新する
 */
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

/**
 * フィードを読み込む
 * @param {string|string[]} feedUrlInput - フィードURLの配列または改行区切りの文字列
 * @returns {Promise<void>}
 */
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

/**
 * フィードの読み込み結果を適用する
 * @param {Object} loadResult - 読み込み結果
 */
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
    resetVisibleArticleLimit();
    updateFeedLoadStatus(currentFeedResults);
    renderArticles();
}

/**
 * フィードの読み込み状態UIを更新する
 * @param {Object[]} results - 各フィードの取得結果
 */
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

/**
 * フィードのステータスメッセージを設定する
 * @param {string} type - メッセージタイプ (success, warning, error など)
 * @param {string} message - 表示するメッセージ
 * @param {boolean} [showRetry=false] - 再試行ボタンを表示するかどうか
 */
function setFeedStatus(type, message, showRetry = false) {
    const retryButton = document.getElementById('feed-retry-btn');
    if (!retryButton) return;

    window.ApiUI?.setStatus('feed-status', message, {
        type,
        baseClass: 'feed-status'
    });
    retryButton.hidden = !showRetry;
}

/**
 * 記事の描画を行う
 */
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
        FeedRenderer.renderSplitArticles(container, selectedArticles, currentFeedResults, getFeedActions(), {
            maxTotalItems: visibleArticleLimit,
            maxItemsPerFeed: visibleArticleLimit
        });
    } else {
        FeedRenderer.renderMixedArticles(container, selectedArticles, getFeedActions(), {
            maxItems: visibleArticleLimit
        });
    }

    appendLoadMoreButton(container, selectedArticles.length);
}

/**
 * フィードの各アクション関数をまとめたオブジェクトを取得する
 * @returns {Object} アクションオブジェクト
 */
function getFeedActions() {
    return {
        favoriteArticles,
        readArticleIds,
        onMarkReadArticle: markReadArticle,
        onOpenArticle: openModal,
        onSummarizeArticle: summarizeArticle,
        onToggleFavorite(article) {
            toggleFavorite(article);
            renderArticles();
        }
    };
}

/**
 * 表示件数を初期値へ戻す
 */
function resetVisibleArticleLimit() {
    visibleArticleLimit = getDefaultArticleLimit();
}

/**
 * 現在の表示モードに応じた初期表示件数を取得する
 * @returns {number} 初期表示件数
 */
function getDefaultArticleLimit() {
    return feedDisplayMode === 'split' ? FeedConstants.splitMaxTotalItems : FeedConstants.maxItems;
}

/**
 * 残り記事がある場合に追加表示ボタンを末尾へ追加する
 * @param {HTMLElement} container - 記事一覧コンテナ
 * @param {number} totalCount - 絞り込み後の記事総数
 */
function appendLoadMoreButton(container, totalCount) {
    if (visibleArticleLimit >= totalCount) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'feed-load-more';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-btn';
    button.textContent = `もっと読み込む (${Math.min(FeedConstants.loadMoreIncrement, totalCount - visibleArticleLimit)}件)`;
    button.addEventListener('click', () => {
        visibleArticleLimit += FeedConstants.loadMoreIncrement;
        renderArticles();
    });

    wrapper.appendChild(button);
    container.appendChild(wrapper);
}

/**
 * 記事を既読として保存する
 * @param {Object} article - 対象記事
 */
function markReadArticle(article) {
    if (!article?.id || readArticleIds.has(article.id)) return;

    readArticleIds.add(article.id);
    writeJsonToStorage(FeedConstants.storageKeys.readArticles, Array.from(readArticleIds).slice(-500));
}

/**
 * 記事を要約する
 * @param {Object} article - 記事オブジェクト
 */
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

/**
 * 記事のお気に入り状態を切り替える
 * @param {Object} article - 記事オブジェクト
 */
function toggleFavorite(article) {
    const index = favoriteArticles.findIndex(favorite => favorite.id === article.id);

    if (index === -1) {
        favoriteArticles.push(article);
    } else {
        favoriteArticles.splice(index, 1);
    }

    writeJsonToStorage(FeedConstants.storageKeys.favorites, favoriteArticles);
}

/**
 * OPMLファイルを読み込み、保存済みフィードへ追加する
 * @param {HTMLInputElement} input - OPMLファイル入力
 * @param {HTMLTextAreaElement|null} urlInput - フィードURL入力欄
 */
function importOpmlFile(input, urlInput) {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const importedUrls = FeedData.parseOpmlFeedUrls(reader.result);
        if (importedUrls.length === 0) {
            window.showNotification('OPMLから有効なフィードURLを読み取れませんでした。', 'error');
            input.value = '';
            return;
        }

        const feedUrls = FeedData.parseFeedUrls([...FeedData.getStoredFeedUrls(), ...importedUrls].join('\n'));
        FeedData.saveFeedUrls(feedUrls);
        if (urlInput) urlInput.value = feedUrls.join('\n');
        loadFeed(feedUrls);
        window.showNotification(`${importedUrls.length}件のフィードURLをOPMLから取り込みました。`, 'success');
        input.value = '';
    });
    reader.addEventListener('error', () => {
        window.showNotification('OPMLファイルを読み込めませんでした。', 'error');
        input.value = '';
    });
    reader.readAsText(file);
}

/**
 * 保存済みフィード一覧をOPMLとしてダウンロードする
 */
function exportOpmlFile() {
    const feedUrls = FeedData.getStoredFeedUrls();
    const opml = FeedData.buildOpmlDocument(feedUrls);
    const blob = new Blob([opml], { type: 'application/xml' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'nexus-dash-feeds.opml';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/**
 * 記事のモーダルを開く
 * @param {Object} article - 記事オブジェクト
 */
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

/**
 * 記事のモーダルを閉じる
 */
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
