// ==========================================
// Feed 機能
// ==========================================
(function() {
let currentArticles = [];
let favoriteArticles = readJsonFromStorage(STORAGE_KEY_FAVS, []);
let currentFilter = 'all'; // 記事一覧の表示対象。'all' または 'favorites'。
let currentSearchQuery = '';
let feedDisplayMode = localStorage.getItem(STORAGE_KEY_FEED_MODE) || 'mixed';

window.initFeed = initFeed;
window.initSearch = initSearch;
window.getStoredFeedUrls = getStoredFeedUrls;
window.loadFeed = loadFeed;

// ==========================================
// initFeed — フィードURL読み込みと保存ボタン
// ==========================================
function initFeed() {
    const urlInput = document.getElementById('rss-url-input') || document.getElementById('feed-url-input');
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-rss-btn') || document.getElementById('save-url-btn');

    if (presetRss && urlInput) {
        presetRss.addEventListener('change', () => {
            // プリセット選択は入力欄へ反映し、すぐ保存・再読み込みまで行う。
            const selectedUrl = presetRss.value;
            if (selectedUrl === '') return;

            urlInput.value = selectedUrl;
            presetRss.value = '';

            saveFeedUrls([selectedUrl]);
            loadFeed([selectedUrl]);
        });
    }

    if (urlInput) {
        urlInput.value = getStoredFeedUrls().join('\n');
    }

    if (saveBtn && urlInput) {
        saveBtn.addEventListener('click', () => {
            const feedUrls = parseFeedUrls(urlInput.value);
            if (feedUrls.length === 0) return;

            saveFeedUrls(feedUrls);
            loadFeed(feedUrls);
            window._toggleSidebar?.();
        });
    }

    const toggleFeedModeBtn = document.getElementById('btn-toggle-feed-mode');
    if (toggleFeedModeBtn) {
        const updateFeedModeBtnText = () => {
            toggleFeedModeBtn.textContent = feedDisplayMode === 'mixed' ? 'フィード別表示' : '混合表示';
        };
        updateFeedModeBtnText();

        toggleFeedModeBtn.addEventListener('click', () => {
            feedDisplayMode = feedDisplayMode === 'mixed' ? 'split' : 'mixed';
            localStorage.setItem(STORAGE_KEY_FEED_MODE, feedDisplayMode);
            updateFeedModeBtnText();
            renderArticles();
        });
    }

    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('article-modal');
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ==========================================
// initSearch — 検索入力とタブフィルタリング
// ==========================================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favorites');
    if (!searchInput || !tabAll || !tabFavs) return;

    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        renderArticles();
    });

    tabAll.addEventListener('click', () => {
        currentFilter = 'all';
        tabAll.classList.add('active');
        tabFavs.classList.remove('active');
        renderArticles();
    });

    tabFavs.addEventListener('click', () => {
        currentFilter = 'favorites';
        tabFavs.classList.add('active');
        tabAll.classList.remove('active');
        renderArticles();
    });
}

// ==========================================
// フィードの取得と解析
// ==========================================
function parseFeedUrls(value) {
    return value
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean);
}

function getStoredFeedUrls() {
    const savedValue = localStorage.getItem(STORAGE_KEY_URL) || '';
    const feedUrls = parseFeedUrls(savedValue);
    return feedUrls.length > 0 ? feedUrls : DEFAULT_FEED_URLS;
}

function saveFeedUrls(feedUrls) {
    localStorage.setItem(STORAGE_KEY_URL, feedUrls.join('\n'));
}

async function loadFeed(feedUrlInput) {
    const container = document.getElementById('feed-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">記事を読み込み中...</div>';
    const feedUrls = Array.isArray(feedUrlInput) ? feedUrlInput : parseFeedUrls(String(feedUrlInput || ''));

    try {
        // 複数フィードのうち一部が失敗しても、成功した記事は表示する。
        const results = await Promise.allSettled(feedUrls.map(fetchFeedArticles));
        currentArticles = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);

        if (currentArticles.length === 0) {
            const firstError = results.find(result => result.status === 'rejected')?.reason;
            throw firstError || new Error('フィードURLが設定されていません。');
        }

        results
            .filter(result => result.status === 'rejected')
            .forEach(result => console.warn('Feed load failed:', result.reason));
        renderArticles();

    } catch(err) {
        console.error(err);
        container.innerHTML = `<div class="error-msg">フィードの取得に失敗しました。<br><small>${err.message}</small></div>`;
    }
}

async function fetchFeedArticles(url) {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url);
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const data = await res.json();
    if (data.status !== 'ok') {
        throw new Error(data.message || 'フィードの解析に失敗しました。URLが正しいか確認してください。');
    }

    return data.items.map(item => normalizeFeedItem(item, url));
}

function normalizeFeedItem(item, sourceFeedUrl) {
    const dateStr = item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('ja-JP') : '';
    const description = item.description || item.content || '';
    let thumbnail = item.thumbnail || (item.enclosure && item.enclosure.link) || '';
    if (!thumbnail && description) {
        // RSSにサムネイルがない場合は、本文HTML内の先頭画像を代替として使う。
        const match = description.match(/<img[^>]+src="([^">]+)"/);
        if (match) thumbnail = match[1];
    }

    return {
        id: item.link || `${sourceFeedUrl}:${item.title || 'No Title'}:${item.pubDate || ''}`,
        title: item.title || 'No Title',
        url: item.link || '#',
        link: item.link || '#',
        dateStr,
        description,
        summaryHTML: description || '<p>プレビュー内容がありません。</p>',
        thumbnail,
        sourceFeedUrl
    };
}

// ==========================================
// 記事の描画処理（検索とフィルタ対応）
// ==========================================
function renderArticles() {
    const container = document.getElementById('feed-container');
    if (!container) return;
    container.innerHTML = '';

    let targetArticles = currentFilter === 'all' ? currentArticles : favoriteArticles;

    if (currentSearchQuery) {
        // 検索は記事タイトルのみを対象にして、本文HTMLの誤一致を避ける。
        targetArticles = targetArticles.filter(a =>
            a.title.toLowerCase().includes(currentSearchQuery)
        );
    }

    targetArticles = targetArticles.slice(0, FEED_MAX_ITEMS);

    if (targetArticles.length === 0) {
        container.innerHTML = '<div class="loading">表示できる記事がありません。</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    targetArticles.forEach((article) => {
        const div = document.createElement('div');
        div.className = 'item';

        const isFav = favoriteArticles.some(fav => fav.id === article.id);

        div.innerHTML = `
            <div class="item-content">
                <h3 class="item-title">${article.title}</h3>
                <div class="item-meta">${article.dateStr}</div>
            </div>
            <div class="item-actions">
                <button class="ai-summary-btn" title="この記事をAIで要約">要約</button>
                <button class="fav-btn ${isFav ? 'active' : ''}" title="お気に入り">
                    ${isFav ? '★' : '☆'}
                </button>
            </div>
        `;

        const contentDiv = div.querySelector('.item-content');
        contentDiv.addEventListener('click', () => openModal(article));

        const aiBtn = div.querySelector('.ai-summary-btn');
        aiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 要約はGemini APIキーがある場合だけ、既存のAI送信経路を再利用する。
            const apiKey = localStorage.getItem('custom_gemini_api_key');
            if (!apiKey) {
                window.showNotification('左上のメニューから Gemini API Key を設定してください。', 'error');
                return;
            }
            const prompt = `以下の記事の内容を推測し、その魅力や要点を日本語で3行以内で簡潔に要約してください。\nタイトル: ${article.title}\nリンク: ${article.link}\n概要: ${article.description || 'なし'}`;
            window.sendToAI(prompt);
        });

        const favBtn = div.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(article);
            renderArticles();
        });

        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

// ==========================================
// お気に入りの追加・削除
// ==========================================
function toggleFavorite(article) {
    const index = favoriteArticles.findIndex(fav => fav.id === article.id);
    if (index === -1) {
        favoriteArticles.push(article);
    } else {
        favoriteArticles.splice(index, 1);
    }
    writeJsonToStorage(STORAGE_KEY_FAVS, favoriteArticles);
}

// ==========================================
// モーダルで記事プレビューを開く
// ==========================================
function openModal(article) {
    // RSS本文のプレビューHTMLはモーダル内に限定して挿入する。
    document.getElementById('modal-title').textContent = article.title;
    document.getElementById('modal-body').innerHTML = article.summaryHTML;
    document.getElementById('modal-link').href = article.url;

    const modal = document.getElementById('article-modal');
    modal.classList.remove('hidden');
}

// ==========================================
// モーダルを閉じる
// ==========================================
function closeModal() {
    const modal = document.getElementById('article-modal');
    modal.classList.add('hidden');

    setTimeout(() => {
        document.getElementById('modal-body').innerHTML = '';
    }, 300);
}
})();
