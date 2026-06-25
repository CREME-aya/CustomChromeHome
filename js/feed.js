// ==========================================
// Discover / RSS Feed
// ==========================================
(function() {
const FeedCore = window.FeedCore;

// 取得結果はフィード単位で保持し、混合表示と部分失敗表示の両方へ利用する。
let currentFeedResults = [];
let currentArticles = [];
let favoriteArticles = readJsonFromStorage(STORAGE_KEY_FAVS, []);
let currentFilter = 'all';
let currentSearchQuery = '';
let feedDisplayMode = FeedCore.normalizeDisplayMode(localStorage.getItem(STORAGE_KEY_FEED_MODE));
let activeLoadGeneration = 0;
let activeControllers = [];
let searchDebounceTimer = null;
let lastActiveElement = null;

window.initFeed = initFeed;
window.initSearch = initSearch;
window.getStoredFeedUrls = getStoredFeedUrls;
window.loadFeed = loadFeed;

function initFeed() {
    const urlInput = document.getElementById('rss-url-input') || document.getElementById('feed-url-input');
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-rss-btn') || document.getElementById('save-url-btn');
    const retryBtn = document.getElementById('feed-retry-btn');

    if (urlInput) urlInput.value = getStoredFeedUrls().join('\n');

    presetRss?.addEventListener('change', () => {
        const selectedUrl = presetRss.value;
        if (!selectedUrl || !urlInput) return;

        urlInput.value = selectedUrl;
        presetRss.value = '';
        saveFeedUrls([selectedUrl]);
        loadFeed([selectedUrl]);
    });

    saveBtn?.addEventListener('click', () => {
        if (!urlInput) return;

        const feedUrls = parseFeedUrls(urlInput.value);
        if (feedUrls.length === 0) {
            window.showNotification('有効なRSS / Atom URLを入力してください。', 'error');
            return;
        }

        saveFeedUrls(feedUrls);
        loadFeed(feedUrls);
        window._toggleSidebar?.();
    });

    retryBtn?.addEventListener('click', () => loadFeed(getStoredFeedUrls()));
    initFeedModeControls();

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
        localStorage.setItem(STORAGE_KEY_FEED_MODE, feedDisplayMode);
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

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favorites');
    if (!searchInput || !tabAll || !tabFavs) return;

    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentSearchQuery = event.target.value;
            renderArticles();
        }, FEED_SEARCH_DEBOUNCE_MS);
    });

    tabAll.addEventListener('click', () => setArticleFilter('all', tabAll, tabFavs));
    tabFavs.addEventListener('click', () => setArticleFilter('favorites', tabFavs, tabAll));
}

function setArticleFilter(filter, activeTab, inactiveTab) {
    currentFilter = filter;
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    activeTab.setAttribute('aria-pressed', 'true');
    inactiveTab.setAttribute('aria-pressed', 'false');
    renderArticles();
}

function parseFeedUrls(value) {
    const uniqueUrls = new Set();

    String(value || '')
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean)
        .forEach((url) => {
            const safeUrl = getSafeHttpUrl(url);
            if (safeUrl) uniqueUrls.add(safeUrl);
        });

    return Array.from(uniqueUrls);
}

function getStoredFeedUrls() {
    const feedUrls = parseFeedUrls(localStorage.getItem(STORAGE_KEY_URL) || '');
    return feedUrls.length > 0 ? feedUrls : DEFAULT_FEED_URLS;
}

function saveFeedUrls(feedUrls) {
    localStorage.setItem(STORAGE_KEY_URL, feedUrls.join('\n'));
}

async function loadFeed(feedUrlInput) {
    const feedUrls = Array.isArray(feedUrlInput)
        ? parseFeedUrls(feedUrlInput.join('\n'))
        : parseFeedUrls(feedUrlInput);

    activeLoadGeneration += 1;
    const loadGeneration = activeLoadGeneration;
    abortActiveFeedRequests();

    if (feedUrls.length === 0) {
        currentFeedResults = [];
        currentArticles = [];
        setFeedStatus('empty', 'フィードが設定されていません。');
        renderArticles();
        return;
    }

    setFeedStatus('loading', `${feedUrls.length}件のフィードを読み込み中...`);

    const tasks = feedUrls.map((feedUrl, sourceOrder) => () => loadSingleFeed(feedUrl, sourceOrder));
    const results = await runWithConcurrency(tasks, FEED_MAX_CONCURRENT_REQUESTS);

    // 設定変更後に古い通信が完了しても、最新画面を上書きさせない。
    if (loadGeneration !== activeLoadGeneration) return;

    const cache = readFeedCache();
    currentFeedResults = results.map((result, index) => {
        if (result.status === 'success') {
            writeFeedCacheEntry(cache, result);
            return result;
        }

        const cachedResult = getCachedFeedResult(cache, feedUrls[index], index);
        return cachedResult || result;
    });
    writeFeedCache(cache);

    currentArticles = FeedCore.sortArticles(
        FeedCore.deduplicateArticles(
            currentFeedResults.flatMap(result => result.articles || [])
        )
    );

    updateFeedLoadStatus(currentFeedResults);
    renderArticles();
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
    const feedHostname = getFeedHostname(feedUrl);
    const startedAt = Date.now();

    for (let attempt = 0; attempt <= FEED_MAX_RETRIES; attempt += 1) {
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
            const shouldRetry = attempt < FEED_MAX_RETRIES && isRetryableFeedError(error);
            if (shouldRetry) {
                const randomDelay = Math.floor(Math.random() * (800 - 300 + 1)) + 300;
                await wait(randomDelay);
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
    const timeoutId = setTimeout(() => controller.abort('timeout'), FEED_REQUEST_TIMEOUT_MS);
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
        feedTitle: getFeedHostname(feedUrl) || '不明なフィード',
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

function updateFeedLoadStatus(results) {
    const successfulResults = results.filter(result => ['success', 'stale'].includes(result.status));
    const failedResults = results.filter(result => result.status === 'error');
    const staleResults = results.filter(result => result.status === 'stale');

    if (successfulResults.length === 0) {
        setFeedStatus('error', 'フィードを取得できませんでした。再試行してください。', true);
        return;
    }

    if (failedResults.length > 0) {
        setFeedStatus(
            'warning',
            `${results.length}件中${failedResults.length}件の取得に失敗しました。成功した記事を表示しています。`
        );
        return;
    }

    if (staleResults.length > 0) {
        setFeedStatus('warning', '前回取得した記事を含めて表示しています。');
        return;
    }

    setFeedStatus('success', `${currentArticles.length}件の記事を読み込みました。`);
}

function setFeedStatus(type, message, showRetry = false) {
    const status = document.getElementById('feed-status');
    const retryButton = document.getElementById('feed-retry-btn');
    if (!status || !retryButton) return;

    status.className = `feed-status ${type}`;
    status.textContent = message;
    retryButton.hidden = !showRetry;
}

function renderArticles() {
    const container = document.getElementById('feed-container');
    if (!container) return;

    container.replaceChildren();
    const selectedArticles = getSelectedArticles();

    if (selectedArticles.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'feed-empty-state';
        emptyState.textContent = currentFilter === 'favorites'
            ? 'お気に入りの記事がありません。'
            : currentSearchQuery
                ? '検索条件に一致する記事がありません。'
                : '表示できる記事がありません。';
        container.appendChild(emptyState);
        return;
    }

    if (feedDisplayMode === 'split') {
        renderSplitArticles(container, selectedArticles);
    } else {
        renderMixedArticles(container, selectedArticles);
    }
}

function getSelectedArticles() {
    const favoriteIds = favoriteArticles.map(article => article.id);
    return FeedCore.filterArticles(currentArticles, {
        query: currentSearchQuery,
        favoritesOnly: currentFilter === 'favorites',
        favoriteIds
    });
}

function renderMixedArticles(container, articles) {
    articles
        .slice(0, FEED_MAX_ITEMS)
        .forEach(article => container.appendChild(createArticleElement(article)));
}

function renderSplitArticles(container, articles) {
    const groups = FeedCore.groupArticlesBySource(articles);
    let renderedCount = 0;

    groups.forEach((group) => {
        if (renderedCount >= FEED_SPLIT_MAX_TOTAL_ITEMS) return;

        const section = document.createElement('section');
        section.className = 'feed-group';

        const title = document.createElement('h3');
        title.className = 'feed-group-title';
        title.textContent = group.feedTitle;
        section.appendChild(title);

        const itemContainer = document.createElement('div');
        itemContainer.className = 'feed-group-items';
        group.articles
            .slice(0, FEED_SPLIT_MAX_ITEMS_PER_FEED)
            .slice(0, FEED_SPLIT_MAX_TOTAL_ITEMS - renderedCount)
            .forEach((article) => {
                itemContainer.appendChild(createArticleElement(article));
                renderedCount += 1;
            });

        section.appendChild(itemContainer);
        container.appendChild(section);
    });

    currentFeedResults
        .filter(result => result.status === 'error')
        .forEach(result => container.appendChild(createFeedErrorElement(result)));
}

function createArticleElement(article) {
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
    contentButton.addEventListener('click', () => openModal(article));

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const aiButton = document.createElement('button');
    aiButton.className = 'ai-summary-btn';
    aiButton.type = 'button';
    aiButton.textContent = '要約';
    aiButton.setAttribute('aria-label', `${article.title}をAIで要約`);
    aiButton.addEventListener('click', () => summarizeArticle(article));

    const isFavorite = favoriteArticles.some(favorite => favorite.id === article.id);
    const favoriteButton = document.createElement('button');
    favoriteButton.className = `fav-btn${isFavorite ? ' active' : ''}`;
    favoriteButton.type = 'button';
    favoriteButton.textContent = isFavorite ? '★' : '☆';
    favoriteButton.setAttribute('aria-label', isFavorite ? 'お気に入りから削除' : 'お気に入りに追加');
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
    favoriteButton.addEventListener('click', () => {
        toggleFavorite(article);
        renderArticles();
    });

    actions.append(aiButton, favoriteButton);
    articleElement.append(contentButton, actions);
    return articleElement;
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

function summarizeArticle(article) {
    const apiKey = localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY);
    if (!apiKey) {
        window.showNotification('左上のメニューから Gemini API Key を設定してください。', 'error');
        return;
    }

    const prompt = `以下の記事を日本語で3行以内に要約してください。\nタイトル: ${article.title}\nリンク: ${article.link || 'なし'}\n概要: ${stripHtml(article.description) || 'なし'}`;
    window.sendToAI(prompt);
}

function toggleFavorite(article) {
    const index = favoriteArticles.findIndex(favorite => favorite.id === article.id);

    if (index === -1) {
        favoriteArticles.push(article);
    } else {
        favoriteArticles.splice(index, 1);
    }

    writeJsonToStorage(STORAGE_KEY_FAVS, favoriteArticles);
}

function openModal(article) {
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const link = document.getElementById('modal-link');
    const modal = document.getElementById('article-modal');
    if (!title || !body || !link || !modal) return;

    lastActiveElement = document.activeElement;

    title.textContent = article.title;
    body.replaceChildren(createSanitizedPreview(article.summaryHTML));

    const safeUrl = getSafeHttpUrl(article.url);
    link.href = safeUrl || '#';
    link.hidden = !safeUrl;
    link.rel = 'noopener noreferrer';
    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('close-modal-btn');
    closeBtn?.focus();
}

function createSanitizedPreview(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '<p>プレビュー内容がありません。</p>');
    sanitizeNodeTree(template.content);
    return template.content;
}

function sanitizeNodeTree(root) {
    const allowedTags = new Set([
        'P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I',
        'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'A', 'IMG'
    ]);

    const discardTags = new Set([
        'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'CANVAS', 'VIDEO', 'AUDIO'
    ]);

    Array.from(root.querySelectorAll('*')).forEach((element) => {
        const tagName = element.tagName;
        if (discardTags.has(tagName)) {
            element.remove();
            return;
        }

        if (!allowedTags.has(tagName)) {
            element.replaceWith(...element.childNodes);
            return;
        }

        const originalHref = element.getAttribute('href');
        const originalSource = element.getAttribute('src');
        Array.from(element.attributes).forEach(attribute => element.removeAttribute(attribute.name));

        if (tagName === 'A') {
            const safeHref = getSafeHttpUrl(originalHref);
            if (safeHref) {
                element.href = safeHref;
                element.target = '_blank';
                element.rel = 'noopener noreferrer';
            }
        }

        if (tagName === 'IMG') {
            const safeSource = getSafeHttpUrl(originalSource);
            if (safeSource) {
                element.src = safeSource;
                element.alt = '';
                element.loading = 'lazy';
            } else {
                element.remove();
            }
        }
    });
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

function getSafeHttpUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (error) {
        return '';
    }
}

function getFeedHostname(feedUrl) {
    try {
        return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch (error) {
        return '';
    }
}

function stripHtml(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    return template.content.textContent.trim();
}

function wait(durationMs) {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

function readFeedCache() {
    const cache = readJsonFromStorage(STORAGE_KEY_FEED_CACHE, {});
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
}

function writeFeedCache(cache) {
    try {
        writeJsonToStorage(STORAGE_KEY_FEED_CACHE, cache);
    } catch (error) {
        console.warn('Feed cache write failed');
    }
}

function writeFeedCacheEntry(cache, result) {
    cache[result.feedKey] = {
        feedTitle: result.feedTitle,
        fetchedAt: result.fetchedAt,
        articles: result.articles.slice(0, FEED_CACHE_ITEMS_PER_FEED).map(article => ({
            ...article,
            sourceFeedUrl: ''
        }))
    };
}

function getCachedFeedResult(cache, feedUrl, sourceOrder) {
    const feedKey = FeedCore.createFeedKey(feedUrl);
    const entry = cache[feedKey];
    if (!entry || Date.now() - entry.fetchedAt > FEED_CACHE_TTL_MS) return null;

    return {
        feedUrl,
        feedKey,
        feedTitle: entry.feedTitle || getFeedHostname(feedUrl),
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
