// ==========================================
// Feed 機能
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 変数「currentArticles」を、この後の処理で使う値として用意する。
let currentArticles = [];
// 詳細: 変数「favoriteArticles」を、この後の処理で使う値として用意する。
let favoriteArticles = readJsonFromStorage(STORAGE_KEY_FAVS, []);
// 詳細: 変数「currentFilter」を、この後の処理で使う値として用意する。
let currentFilter = 'all'; // 記事一覧の表示対象。'all' または 'favorites'。
// 詳細: 変数「currentSearchQuery」を、この後の処理で使う値として用意する。
let currentSearchQuery = '';
// 詳細: 変数「feedDisplayMode」を、この後の処理で使う値として用意する。
let feedDisplayMode = localStorage.getItem(STORAGE_KEY_FEED_MODE) || 'mixed';

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initFeed = initFeed;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initSearch = initSearch;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.getStoredFeedUrls = getStoredFeedUrls;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.loadFeed = loadFeed;

// ==========================================
// initFeed — フィードURL読み込みと保存ボタン
// ==========================================
// 詳細: 関数「initFeed」の処理ブロックを開始する。
function initFeed() {
    // 詳細: 変数「urlInput」を、この後の処理で使う値として用意する。
    const urlInput = document.getElementById('rss-url-input') || document.getElementById('feed-url-input');
    // 詳細: 変数「presetRss」を、この後の処理で使う値として用意する。
    const presetRss = document.getElementById('preset-rss');
    // 詳細: 変数「saveBtn」を、この後の処理で使う値として用意する。
    const saveBtn = document.getElementById('save-rss-btn') || document.getElementById('save-url-btn');

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (presetRss && urlInput) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        presetRss.addEventListener('change', () => {
            // プリセット選択は入力欄へ反映し、すぐ保存・再読み込みまで行う。
            // 詳細: 変数「selectedUrl」を、この後の処理で使う値として用意する。
            const selectedUrl = presetRss.value;
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (selectedUrl === '') return;

            // 詳細: 次の処理行「urlInput.value = selectedUrl;」の役割を、その場の制御フローに組み込む。
            urlInput.value = selectedUrl;
            // 詳細: 次の処理行「presetRss.value = '';」の役割を、その場の制御フローに組み込む。
            presetRss.value = '';

            // 詳細: 次の処理行「saveFeedUrls([selectedUrl]);」の役割を、その場の制御フローに組み込む。
            saveFeedUrls([selectedUrl]);
            // 詳細: 次の処理行「loadFeed([selectedUrl]);」の役割を、その場の制御フローに組み込む。
            loadFeed([selectedUrl]);
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (urlInput) {
        // 詳細: 次の処理行「urlInput.value = getStoredFeedUrls().join('\n');」の役割を、その場の制御フローに組み込む。
        urlInput.value = getStoredFeedUrls().join('\n');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (saveBtn && urlInput) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        saveBtn.addEventListener('click', () => {
            // 詳細: 変数「feedUrls」を、この後の処理で使う値として用意する。
            const feedUrls = parseFeedUrls(urlInput.value);
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (feedUrls.length === 0) return;

            // 詳細: 次の処理行「saveFeedUrls(feedUrls);」の役割を、その場の制御フローに組み込む。
            saveFeedUrls(feedUrls);
            // 詳細: 次の処理行「loadFeed(feedUrls);」の役割を、その場の制御フローに組み込む。
            loadFeed(feedUrls);
            // 詳細: 次の処理行「window._toggleSidebar?.();」の役割を、その場の制御フローに組み込む。
            window._toggleSidebar?.();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「toggleFeedModeBtn」を、この後の処理で使う値として用意する。
    const toggleFeedModeBtn = document.getElementById('btn-toggle-feed-mode');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (toggleFeedModeBtn) {
        // 詳細: 変数「updateFeedModeBtnText」を、この後の処理で使う値として用意する。
        const updateFeedModeBtnText = () => {
            // 詳細: 画面に表示するテキストを安全に更新する。
            toggleFeedModeBtn.textContent = feedDisplayMode === 'mixed' ? 'フィード別表示' : '混合表示';
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };
        // 詳細: 次の処理行「updateFeedModeBtnText();」の役割を、その場の制御フローに組み込む。
        updateFeedModeBtnText();

        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        toggleFeedModeBtn.addEventListener('click', () => {
            // 詳細: 次の処理行「feedDisplayMode = feedDisplayMode === 'mixed' ? 'split' : 'mixed';」の役割を、その場の制御フローに組み込む。
            feedDisplayMode = feedDisplayMode === 'mixed' ? 'split' : 'mixed';
            // 詳細: ユーザー設定や状態を localStorage に保存する。
            localStorage.setItem(STORAGE_KEY_FEED_MODE, feedDisplayMode);
            // 詳細: 次の処理行「updateFeedModeBtnText();」の役割を、その場の制御フローに組み込む。
            updateFeedModeBtnText();
            // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
            renderArticles();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「closeModalBtn」を、この後の処理で使う値として用意する。
    const closeModalBtn = document.getElementById('close-modal-btn');
    // 詳細: 変数「modal」を、この後の処理で使う値として用意する。
    const modal = document.getElementById('article-modal');
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    closeModalBtn?.addEventListener('click', closeModal);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    modal?.addEventListener('click', (e) => {
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (e.target === modal) closeModal();
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// initSearch — 検索入力とタブフィルタリング
// ==========================================
// 詳細: 関数「initSearch」の処理ブロックを開始する。
function initSearch() {
    // 詳細: 変数「searchInput」を、この後の処理で使う値として用意する。
    const searchInput = document.getElementById('search-input');
    // 詳細: 変数「tabAll」を、この後の処理で使う値として用意する。
    const tabAll = document.getElementById('tab-all');
    // 詳細: 変数「tabFavs」を、この後の処理で使う値として用意する。
    const tabFavs = document.getElementById('tab-favorites');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!searchInput || !tabAll || !tabFavs) return;

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    searchInput.addEventListener('input', (e) => {
        // 詳細: 次の処理行「currentSearchQuery = e.target.value.toLowerCase();」の役割を、その場の制御フローに組み込む。
        currentSearchQuery = e.target.value.toLowerCase();
        // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
        renderArticles();
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    tabAll.addEventListener('click', () => {
        // 詳細: 次の処理行「currentFilter = 'all';」の役割を、その場の制御フローに組み込む。
        currentFilter = 'all';
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        tabAll.classList.add('active');
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        tabFavs.classList.remove('active');
        // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
        renderArticles();
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    tabFavs.addEventListener('click', () => {
        // 詳細: 次の処理行「currentFilter = 'favorites';」の役割を、その場の制御フローに組み込む。
        currentFilter = 'favorites';
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        tabFavs.classList.add('active');
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        tabAll.classList.remove('active');
        // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
        renderArticles();
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// フィードの取得と解析
// ==========================================
// 詳細: 関数「parseFeedUrls」の処理ブロックを開始する。
function parseFeedUrls(value) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return value
        // 詳細: 次の処理行「.split('\n')」の役割を、その場の制御フローに組み込む。
        .split('\n')
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        .map(url => url.trim())
        // 詳細: 次の処理行「.filter(Boolean);」の役割を、その場の制御フローに組み込む。
        .filter(Boolean);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getStoredFeedUrls」の処理ブロックを開始する。
function getStoredFeedUrls() {
    // 詳細: 変数「savedValue」を、この後の処理で使う値として用意する。
    const savedValue = localStorage.getItem(STORAGE_KEY_URL) || '';
    // 詳細: 変数「feedUrls」を、この後の処理で使う値として用意する。
    const feedUrls = parseFeedUrls(savedValue);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return feedUrls.length > 0 ? feedUrls : DEFAULT_FEED_URLS;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「saveFeedUrls」の処理ブロックを開始する。
function saveFeedUrls(feedUrls) {
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(STORAGE_KEY_URL, feedUrls.join('\n'));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「loadFeed」の処理ブロックを開始する。
async function loadFeed(feedUrlInput) {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    const container = document.getElementById('feed-container');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!container) return;
    // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
    container.innerHTML = '<div class="loading">記事を読み込み中...</div>';
    // 詳細: 変数「feedUrls」を、この後の処理で使う値として用意する。
    const feedUrls = Array.isArray(feedUrlInput) ? feedUrlInput : parseFeedUrls(String(feedUrlInput || ''));

    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 複数フィードのうち一部が失敗しても、成功した記事は表示する。
        // 詳細: 変数「results」を、この後の処理で使う値として用意する。
        const results = await Promise.allSettled(feedUrls.map(fetchFeedArticles));
        // 詳細: 次の処理行「currentArticles = results」の役割を、その場の制御フローに組み込む。
        currentArticles = results
            // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
            .filter(result => result.status === 'fulfilled')
            // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
            .flatMap(result => result.value);

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (currentArticles.length === 0) {
            // 詳細: 変数「firstError」を、この後の処理で使う値として用意する。
            const firstError = results.find(result => result.status === 'rejected')?.reason;
            // 詳細: 異常状態を呼び出し元へ明示的に伝える。
            throw firstError || new Error('フィードURLが設定されていません。');
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「results」の役割を、その場の制御フローに組み込む。
        results
            // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
            .filter(result => result.status === 'rejected')
            // 詳細: 複数の要素を順番に処理するための反復処理を行う。
            .forEach(result => console.warn('Feed load failed:', result.reason));
        // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
        renderArticles();

    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(err) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error(err);
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        container.innerHTML = `<div class="error-msg">フィードの取得に失敗しました。<br><small>${err.message}</small></div>`;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「fetchFeedArticles」の処理ブロックを開始する。
async function fetchFeedArticles(url) {
    // 詳細: 変数「apiUrl」を、この後の処理で使う値として用意する。
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url);
    // 詳細: 変数「res」を、この後の処理で使う値として用意する。
    const res = await fetch(apiUrl);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    // 詳細: 変数「data」を、この後の処理で使う値として用意する。
    const data = await res.json();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (data.status !== 'ok') {
        // 詳細: 異常状態を呼び出し元へ明示的に伝える。
        throw new Error(data.message || 'フィードの解析に失敗しました。URLが正しいか確認してください。');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return data.items.map(item => normalizeFeedItem(item, url));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「normalizeFeedItem」の処理ブロックを開始する。
function normalizeFeedItem(item, sourceFeedUrl) {
    // 詳細: 変数「dateStr」を、この後の処理で使う値として用意する。
    const dateStr = item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('ja-JP') : '';
    // 詳細: 変数「description」を、この後の処理で使う値として用意する。
    const description = item.description || item.content || '';
    // 詳細: 変数「thumbnail」を、この後の処理で使う値として用意する。
    let thumbnail = item.thumbnail || (item.enclosure && item.enclosure.link) || '';
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!thumbnail && description) {
        // RSSにサムネイルがない場合は、本文HTML内の先頭画像を代替として使う。
        // 詳細: 変数「match」を、この後の処理で使う値として用意する。
        const match = description.match(/<img[^>]+src="([^">]+)"/);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (match) thumbnail = match[1];
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: オブジェクトのプロパティ値を定義する。
        id: item.link || `${sourceFeedUrl}:${item.title || 'No Title'}:${item.pubDate || ''}`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        title: item.title || 'No Title',
        // 詳細: オブジェクトのプロパティ値を定義する。
        url: item.link || '#',
        // 詳細: オブジェクトのプロパティ値を定義する。
        link: item.link || '#',
        // 詳細: 次の処理行「dateStr,」の役割を、その場の制御フローに組み込む。
        dateStr,
        // 詳細: 次の処理行「description,」の役割を、その場の制御フローに組み込む。
        description,
        // 詳細: オブジェクトのプロパティ値を定義する。
        summaryHTML: description || '<p>プレビュー内容がありません。</p>',
        // 詳細: 次の処理行「thumbnail,」の役割を、その場の制御フローに組み込む。
        thumbnail,
        // 詳細: 次の処理行「sourceFeedUrl」の役割を、その場の制御フローに組み込む。
        sourceFeedUrl
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// 記事の描画処理（検索とフィルタ対応）
// ==========================================
// 詳細: 関数「renderArticles」の処理ブロックを開始する。
function renderArticles() {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    const container = document.getElementById('feed-container');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!container) return;
    // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
    container.innerHTML = '';

    // 詳細: 変数「targetArticles」を、この後の処理で使う値として用意する。
    let targetArticles = currentFilter === 'all' ? currentArticles : favoriteArticles;

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (currentSearchQuery) {
        // 検索は記事タイトルのみを対象にして、本文HTMLの誤一致を避ける。
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        targetArticles = targetArticles.filter(a =>
            // 詳細: 次の処理行「a.title.toLowerCase().includes(currentSearchQuery)」の役割を、その場の制御フローに組み込む。
            a.title.toLowerCase().includes(currentSearchQuery)
        // 詳細: 次の処理行「);」の役割を、その場の制御フローに組み込む。
        );
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 次の処理行「targetArticles = targetArticles.slice(0, FEED_MAX_ITEMS);」の役割を、その場の制御フローに組み込む。
    targetArticles = targetArticles.slice(0, FEED_MAX_ITEMS);

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (targetArticles.length === 0) {
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        container.innerHTML = '<div class="loading">表示できる記事がありません。</div>';
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「fragment」を、この後の処理で使う値として用意する。
    const fragment = document.createDocumentFragment();

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    targetArticles.forEach((article) => {
        // 詳細: 変数「div」を、この後の処理で使う値として用意する。
        const div = document.createElement('div');
        // 詳細: 次の処理行「div.className = 'item';」の役割を、その場の制御フローに組み込む。
        div.className = 'item';

        // 詳細: 変数「isFav」を、この後の処理で使う値として用意する。
        const isFav = favoriteArticles.some(fav => fav.id === article.id);

        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
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

        // 詳細: 変数「contentDiv」を、この後の処理で使う値として用意する。
        const contentDiv = div.querySelector('.item-content');
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        contentDiv.addEventListener('click', () => openModal(article));

        // 詳細: 変数「aiBtn」を、この後の処理で使う値として用意する。
        const aiBtn = div.querySelector('.ai-summary-btn');
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        aiBtn.addEventListener('click', (e) => {
            // 詳細: 次の処理行「e.stopPropagation();」の役割を、その場の制御フローに組み込む。
            e.stopPropagation();
            // 要約はGemini APIキーがある場合だけ、既存のAI送信経路を再利用する。
            // 詳細: 変数「apiKey」を、この後の処理で使う値として用意する。
            const apiKey = localStorage.getItem('custom_gemini_api_key');
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (!apiKey) {
                // 詳細: 次の処理行「window.showNotification('左上のメニューから Gemini API Key を設定してください。', 'error');」の役割を、その場の制御フローに組み込む。
                window.showNotification('左上のメニューから Gemini API Key を設定してください。', 'error');
                // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
                return;
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 変数「prompt」を、この後の処理で使う値として用意する。
            const prompt = `以下の記事の内容を推測し、その魅力や要点を日本語で3行以内で簡潔に要約してください。\nタイトル: ${article.title}\nリンク: ${article.link}\n概要: ${article.description || 'なし'}`;
            // 詳細: 次の処理行「window.sendToAI(prompt);」の役割を、その場の制御フローに組み込む。
            window.sendToAI(prompt);
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });

        // 詳細: 変数「favBtn」を、この後の処理で使う値として用意する。
        const favBtn = div.querySelector('.fav-btn');
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        favBtn.addEventListener('click', (e) => {
            // 詳細: 次の処理行「e.stopPropagation();」の役割を、その場の制御フローに組み込む。
            e.stopPropagation();
            // 詳細: 次の処理行「toggleFavorite(article);」の役割を、その場の制御フローに組み込む。
            toggleFavorite(article);
            // 詳細: 次の処理行「renderArticles();」の役割を、その場の制御フローに組み込む。
            renderArticles();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });

        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        fragment.appendChild(div);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
    container.appendChild(fragment);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// お気に入りの追加・削除
// ==========================================
// 詳細: 関数「toggleFavorite」の処理ブロックを開始する。
function toggleFavorite(article) {
    // 詳細: 変数「index」を、この後の処理で使う値として用意する。
    const index = favoriteArticles.findIndex(fav => fav.id === article.id);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (index === -1) {
        // 詳細: 次の処理行「favoriteArticles.push(article);」の役割を、その場の制御フローに組み込む。
        favoriteArticles.push(article);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } else {
        // 詳細: 次の処理行「favoriteArticles.splice(index, 1);」の役割を、その場の制御フローに組み込む。
        favoriteArticles.splice(index, 1);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_FAVS, favoriteArticles);」の役割を、その場の制御フローに組み込む。
    writeJsonToStorage(STORAGE_KEY_FAVS, favoriteArticles);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// モーダルで記事プレビューを開く
// ==========================================
// 詳細: 関数「openModal」の処理ブロックを開始する。
function openModal(article) {
    // RSS本文のプレビューHTMLはモーダル内に限定して挿入する。
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('modal-title').textContent = article.title;
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('modal-body').innerHTML = article.summaryHTML;
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('modal-link').href = article.url;

    // 詳細: 変数「modal」を、この後の処理で使う値として用意する。
    const modal = document.getElementById('article-modal');
    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
    modal.classList.remove('hidden');
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// モーダルを閉じる
// ==========================================
// 詳細: 関数「closeModal」の処理ブロックを開始する。
function closeModal() {
    // 詳細: 変数「modal」を、この後の処理で使う値として用意する。
    const modal = document.getElementById('article-modal');
    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
    modal.classList.add('hidden');

    // 詳細: 指定時間だけ待ってから、後続の処理を実行する。
    setTimeout(() => {
        // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
        document.getElementById('modal-body').innerHTML = '';
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    }, 300);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
