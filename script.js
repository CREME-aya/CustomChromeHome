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
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-url-btn');

    if (presetRss) {
        presetRss.addEventListener('change', () => {
            if (presetRss.value !== '') {
                urlInput.value = presetRss.value;
            }
        });
    }
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

    // ========== 新機能：時計ウィジェット ==========
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;

        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        dateDisplay.textContent = now.toLocaleDateString('ja-JP', options);
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ========== 新機能：クイックリンク ==========
    const STORAGE_KEY_LINKS = 'custom_quick_links';
    const quickLinksContainer = document.getElementById('quick-links-container');
    const addLinkBtn = document.getElementById('add-link-btn');

    const defaultLinks = [
        { title: 'Google', url: 'https://www.google.com' },
        { title: 'YouTube', url: 'https://www.youtube.com' },
        { title: 'GitHub', url: 'https://github.com' }
    ];

    let quickLinks = JSON.parse(localStorage.getItem(STORAGE_KEY_LINKS));
    if (!quickLinks) {
        quickLinks = defaultLinks;
        localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(quickLinks));
    }

    function renderQuickLinks() {
        quickLinksContainer.innerHTML = '';
        quickLinks.forEach((link, index) => {
            const a = document.createElement('a');
            a.href = link.url;
            a.className = 'quick-link-item';
            
            // アイコンにはGoogleのFavicon APIを利用
            let hostname = 'localhost';
            try { hostname = new URL(link.url).hostname; } catch(e){}
            const iconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
            
            a.innerHTML = `
                <img src="${iconUrl}" class="quick-link-icon" alt="icon">
                <span class="quick-link-title">${link.title}</span>
                <button class="delete-link-btn" title="削除">&times;</button>
            `;

            // 削除ボタンの処理
            const delBtn = a.querySelector('.delete-link-btn');
            delBtn.addEventListener('click', (e) => {
                e.preventDefault(); // リンク遷移を防ぐ
                e.stopPropagation();
                if (confirm(`ショートカット「${link.title}」を削除しますか？`)) {
                    quickLinks.splice(index, 1);
                    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(quickLinks));
                    renderQuickLinks();
                }
            });

            quickLinksContainer.appendChild(a);
        });
    }

    addLinkBtn.addEventListener('click', () => {
        const url = prompt('追加するサイトのURLを入力してください (例: https://qiita.com):');
        if (!url) return;
        
        try {
            new URL(url); // URLのフォーマット検証
            let title = prompt('サイトのタイトルを入力してください:');
            if (!title) title = new URL(url).hostname.replace('www.', '');
            
            quickLinks.push({ title, url });
            localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(quickLinks));
            renderQuickLinks();
        } catch (e) {
            alert('正しいURLを入力してください (必ず https://... から始めてください)。');
        }
    });

    renderQuickLinks();

    // ========== 新機能：クイックメモ（タスク）ウィジェット ==========
    const STORAGE_KEY_MEMO = 'custom_quick_memos';
    const memoInput = document.getElementById('memo-input');
    const memoList = document.getElementById('memo-list');
    let memos = JSON.parse(localStorage.getItem(STORAGE_KEY_MEMO) || '[]');

    function saveMemos() {
        localStorage.setItem(STORAGE_KEY_MEMO, JSON.stringify(memos));
    }

    function renderMemos() {
        memoList.innerHTML = '';
        memos.forEach((memo, index) => {
            const li = document.createElement('li');
            
            const span = document.createElement('span');
            span.className = `memo-text ${memo.completed ? 'completed' : ''}`;
            span.textContent = memo.text;
            span.addEventListener('click', () => {
                memos[index].completed = !memos[index].completed;
                saveMemos();
                renderMemos();
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-memo-btn';
            delBtn.innerHTML = '&times;';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                memos.splice(index, 1);
                saveMemos();
                renderMemos();
            });

            li.appendChild(span);
            li.appendChild(delBtn);
            memoList.appendChild(li);
        });
    }

    memoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && memoInput.value.trim() !== '') {
            memos.push({ text: memoInput.value.trim(), completed: false });
            memoInput.value = '';
            saveMemos();
            renderMemos();
        }
    });

    renderMemos();

    // ========== 新機能：Gemini AI Assistant ==========
    const STORAGE_KEY_GEMINI = 'custom_gemini_api_key';
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const saveGeminiBtn = document.getElementById('save-gemini-btn');
    const geminiChatBox = document.getElementById('gemini-chat-box');
    const geminiInput = document.getElementById('gemini-input');
    const geminiSendBtn = document.getElementById('gemini-send-btn');

    let geminiApiKey = localStorage.getItem(STORAGE_KEY_GEMINI) || '';
    geminiApiKeyInput.value = geminiApiKey;

    // 初期の挨拶メッセージ要素を取得
    const initialAiMsg = document.querySelector('.gemini-chat-box .ai-msg');
    if (geminiApiKey && initialAiMsg) {
        initialAiMsg.textContent = 'APIキーを確認しました！何でも質問してください。';
    }

    saveGeminiBtn.addEventListener('click', () => {
        geminiApiKey = geminiApiKeyInput.value.trim();
        localStorage.setItem(STORAGE_KEY_GEMINI, geminiApiKey);
        alert('Gemini API Key を保存しました！');
        if (geminiApiKey && initialAiMsg) {
            initialAiMsg.textContent = 'APIキーが登録されました！何でも質問してください。';
        }
        toggleSidebar();
    });

    function addChatMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}-msg`;
        
        // 簡単なMarkdown処理 (改行と太字)
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        msgDiv.innerHTML = formattedText;
        geminiChatBox.appendChild(msgDiv);
        geminiChatBox.scrollTop = geminiChatBox.scrollHeight;
    }

    window.sendToGemini = async function sendToGemini(prompt) {
        if (!geminiApiKey) {
            addChatMessage('エラー：サイドバーの設定から Gemini API Key を登録してください。', 'ai');
            return;
        }

        addChatMessage(prompt, 'user');
        geminiInput.value = '';
        geminiSendBtn.disabled = true;

        const loadingId = Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = `loading-${loadingId}`;
        loadingDiv.className = 'chat-msg ai-msg';
        loadingDiv.textContent = '考え中...';
        geminiChatBox.appendChild(loadingDiv);
        geminiChatBox.scrollTop = geminiChatBox.scrollHeight;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            
            const loadingEl = document.getElementById(`loading-${loadingId}`);
            if (loadingEl) loadingEl.remove();

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTPエラーが発生しました (${response.status})`);
            }

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('APIから回答が得られませんでした。APIキーや入力内容を確認してください。');
            }

            const aiText = data.candidates[0]?.content?.parts?.[0]?.text || '(回答が空です)';
            addChatMessage(aiText, 'ai');

        } catch (error) {
            const loadingEl = document.getElementById(`loading-${loadingId}`);
            if (loadingEl) loadingEl.remove();
            addChatMessage(`エラー: ${error.message}`, 'ai');
        } finally {
            geminiSendBtn.disabled = false;
        }
    }

    geminiSendBtn.addEventListener('click', () => {
        const text = geminiInput.value.trim();
        if (text) {
            sendToGemini(text);
        } else {
            alert('質問内容を入力してください。');
        }
    });

    geminiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !geminiSendBtn.disabled) {
            const text = geminiInput.value.trim();
            if (text) {
                sendToGemini(text);
            }
        }
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
        // RSSデータの解析と成形
        currentArticles = data.items.map(item => {
            const dateStr = item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('ja-JP') : '';
            
            // サムネイル画像の取得（thumbnail, enclosure, または description内のimgタグから）
            let thumb = item.thumbnail || (item.enclosure && item.enclosure.link) || '';
            if (!thumb && item.description) {
                const match = item.description.match(/<img[^>]+src="([^">]+)"/);
                if (match) thumb = match[1];
            }

            return {
                id: item.link,
                title: item.title || 'No Title',
                url: item.link || '#',
                dateStr: dateStr,
                summaryHTML: item.description || item.content || '<p>プレビュー内容がありません。</p>',
                thumbnail: thumb
            };
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
            <div class="item-actions">
                <button class="ai-summary-btn" title="この記事をAIで要約">✨ 要約</button>
                <button class="fav-btn ${isFav ? 'active' : ''}" title="お気に入り">
                    ${isFav ? '★' : '☆'}
                </button>
            </div>
        `;

        // 記事クリックでプレビューを開く
        const contentDiv = div.querySelector('.item-content');
        contentDiv.addEventListener('click', () => openModal(article));

        // AI要約ボタン処理
        const aiBtn = div.querySelector('.ai-summary-btn');
        aiBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // モーダルが開くのを防ぐ
            const apiKey = localStorage.getItem('custom_gemini_api_key');
            if (!apiKey) {
                alert('左上のメニュー(☰)から Gemini API Key を設定してください。');
                return;
            }
            const prompt = `以下の記事の内容を推測し、その魅力や要点を日本語で3行以内で簡潔に要約してください。\nタイトル: ${article.title}\nリンク: ${article.link}\n概要: ${article.description || 'なし'}`;
            window.sendToGemini(prompt);
        });

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