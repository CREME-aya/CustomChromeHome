// 定数の定義
const DEFAULT_URL = 'https://qiita.com/popular-items/feed';
const STORAGE_KEY_URL = 'custom_feed_url';
const STORAGE_KEY_FAVS = 'custom_feed_favorites';
const STORAGE_KEY_BG = 'custom_bg_image';

let currentArticles = [];
let favoriteArticles = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVS) || '[]');
let currentFilter = 'all'; // 'all' or 'favorites'
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    // UI要素の取得
    const urlInput = document.getElementById('feed-url-input');
    const saveBtn = document.getElementById('save-url-btn');
    const searchInput = document.getElementById('search-input');
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favorites');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('article-modal');
    
    // サイドバー・背景用要素
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const bgUrlInput = document.getElementById('bg-url-input');
    const bgFileInput = document.getElementById('bg-file-input');
    const saveBgBtn = document.getElementById('save-bg-btn');
    const clearBgBtn = document.getElementById('clear-bg-btn');
    const randomBgBtn = document.getElementById('random-bg-btn');

    // 高品質な風景画像のプリセット（Chrome標準の新しいタブに似た雰囲気のもの）
    const PRESET_BACKGROUNDS = [
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506744012022-28d5002ba30b?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1920&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'
    ];

    // 初期化 (フィード)
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL;
    urlInput.value = savedUrl;
    loadFeed(savedUrl);

    // 初期化 (背景)
    const savedBg = localStorage.getItem(STORAGE_KEY_BG);
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
    }

    // サイドバー開閉ロジック
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        sidebarOverlay.classList.toggle('hidden');
    }
    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // イベントリスナー: フィードURL保存
    saveBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            localStorage.setItem(STORAGE_KEY_URL, url);
            loadFeed(url);
            toggleSidebar();
        }
    });

    // イベントリスナー: ランダム背景（Chrome風）
    randomBgBtn.addEventListener('click', () => {
        const randomUrl = PRESET_BACKGROUNDS[Math.floor(Math.random() * PRESET_BACKGROUNDS.length)];
        applyBackground(randomUrl);
    });

    // イベントリスナー: 背景の適用
    saveBgBtn.addEventListener('click', () => {
        const file = bgFileInput.files[0];
        const bgUrl = bgUrlInput.value.trim();

        if (file) {
            // ファイルが選択されている場合はFile APIでBase64として読み込む
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                applyBackground(dataUrl);
            };
            reader.readAsDataURL(file);
        } else if (bgUrl) {
            // URLが入力されている場合
            applyBackground(bgUrl);
        }
    });

    // イベントリスナー: 背景のクリア
    clearBgBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_BG);
        document.body.style.backgroundImage = '';
        bgUrlInput.value = '';
        bgFileInput.value = '';
    });

    function applyBackground(imgUrl) {
        // Base64はサイズが大きい場合があるため、容量制限(Quotas)に注意する。
        // LocalStorageの制限は通常約5MB。
        try {
            localStorage.setItem(STORAGE_KEY_BG, imgUrl);
            document.body.style.backgroundImage = `url(${imgUrl})`;
        } catch (e) {
            alert('画像の保存に失敗しました。ファイルサイズが大きすぎる可能性があります（推奨: 数百KB以下）。');
        }
    }

    // イベントリスナー: 検索
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        renderArticles();
    });

    // イベントリスナー: タブ切り替え
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

    // イベントリスナー: モーダル閉じる
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // 背景クリックで閉じる
    });
});

/**
 * フィードの取得と解析
 */
async function loadFeed(url) {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<div class="loading">記事を読み込み中...</div>';

    try {
        // RSS/AtomフィードをJSONに変換して返してくれる安定した公式API (rss2json) を使用
        const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url);
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const data = await res.json();
        
        if (data.status !== 'ok') {
            throw new Error(data.message || 'フィードの解析に失敗しました。URLが正しいか確認してください。');
        }

        currentArticles = []; // リセット

        data.items.forEach((item) => {
            const title = item.title || 'No Title';
            const itemUrl = item.link || '#';
            // RSSの仕様によって内容が入っているプロパティが異なるため、フォールバックして取得
            const summaryHTML = item.description || item.content || '<p>プレビュー内容がありません。</p>';
            const dateStr = item.pubDate ? new Date(item.pubDate).toLocaleDateString('ja-JP') : '';

            // 固有IDとしてURLを使用
            currentArticles.push({
                id: itemUrl,
                title,
                url: itemUrl,
                summaryHTML,
                dateStr
            });
        });

        renderArticles();

    } catch(err) {
        console.error(err);
        container.innerHTML = `<div class="error-msg">フィードの取得に失敗しました。<br><small>${err.message}</small></div>`;
    }
}

/**
 * 記事の描画処理（検索とフィルタ対応）
 */
function renderArticles() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '';

    // フィルタリング
    let targetArticles = currentFilter === 'all' ? currentArticles : favoriteArticles;
    
    // 検索語による絞り込み
    if (currentSearchQuery) {
        targetArticles = targetArticles.filter(a => 
            a.title.toLowerCase().includes(currentSearchQuery)
        );
    }

    // 表示を最大5件に制限
    const MAX_ITEMS = 5;
    targetArticles = targetArticles.slice(0, MAX_ITEMS);

    if (targetArticles.length === 0) {
        container.innerHTML = '<div class="loading">表示できる記事がありません。</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    targetArticles.forEach((article) => {
        const div = document.createElement('div');
        div.className = 'item';
        
        // お気に入り状態のチェック
        const isFav = favoriteArticles.some(fav => fav.id === article.id);

        div.innerHTML = `
            <div class="item-content">
                <h3 class="item-title">${article.title}</h3>
                <div class="item-meta">${article.dateStr}</div>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" title="お気に入り">
                ${isFav ? '★' : '☆'}
            </button>
        `;

        // 記事クリックでプレビューを開く
        const contentDiv = div.querySelector('.item-content');
        contentDiv.addEventListener('click', () => openModal(article));

        // お気に入りボタン処理
        const favBtn = div.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // モーダルが開くのを防ぐ
            toggleFavorite(article);
            renderArticles(); // 再描画
        });

        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

/**
 * お気に入りの追加・削除
 */
function toggleFavorite(article) {
    const index = favoriteArticles.findIndex(fav => fav.id === article.id);
    if (index === -1) {
        favoriteArticles.push(article);
    } else {
        favoriteArticles.splice(index, 1);
    }
    localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favoriteArticles));
}

/**
 * モーダルで記事プレビューを開く
 */
function openModal(article) {
    document.getElementById('modal-title').textContent = article.title;
    
    // iframeや不要なスクリプト等を除去したい場合はここでサニタイズ処理を入れることができます
    document.getElementById('modal-body').innerHTML = article.summaryHTML;
    document.getElementById('modal-link').href = article.url;
    
    const modal = document.getElementById('article-modal');
    modal.classList.remove('hidden');
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    const modal = document.getElementById('article-modal');
    modal.classList.add('hidden');
    
    // 少し遅延させてから中身をクリア（フェードアウトアニメーション待ち）
    setTimeout(() => {
        document.getElementById('modal-body').innerHTML = '';
    }, 300);
}