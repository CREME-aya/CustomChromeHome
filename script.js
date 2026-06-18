// ==========================================
// 定数の定義
// ==========================================
const DEFAULT_URL = 'https://qiita.com/popular-items/feed';
const STORAGE_KEY_URL = 'custom_feed_url';
const STORAGE_KEY_FAVS = 'custom_feed_favorites';
const STORAGE_KEY_BG = 'custom_bg_image';
const STORAGE_KEY_SPOTIFY_URL = 'spotify_url';
const STORAGE_KEY_TODOS = 'custom_todos';
const STORAGE_KEY_LINKS = 'custom_quick_links';
const STORAGE_KEY_CALENDAR_ICAL_URL = 'custom_google_calendar_ical_url';
const STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS = 'custom_google_calendar_lookahead_days';
const STORAGE_KEY_OPENAI_API_KEY = 'custom_openai_api_key';
const STORAGE_KEY_ANTHROPIC_API_KEY = 'custom_anthropic_api_key';
const STORAGE_KEY_GEMINI_API_KEY = 'custom_gemini_api_key';
const WEATHER_STORAGE_KEYS = {
    lat: 'custom_weather_lat',
    lon: 'custom_weather_lon',
    name: 'custom_weather_name'
};
const DEFAULT_WEATHER_LOCATION = {
    lat: '35.6895',
    lon: '139.6917',
    name: '東京都'
};
const WEATHER_STATUS_RESET_DELAY_MS = 3000;
const WEATHER_CHART_HOURS = 6;
const WEATHER_CHART_BAR_MAX_HEIGHT = 36;
const WEATHER_CHART_BAR_MIN_HEIGHT = 4;
const WEATHER_CHART_EMPTY_BAR_HEIGHT = 2;
const DEFAULT_CALENDAR_LOOKAHEAD_DAYS = 7;
const MAX_CALENDAR_TODO_IMPORTS = 30;
const WMO_WEATHER = {
    0: { emoji: '☀️', text: '快晴' },
    1: { emoji: '🌤️', text: '晴れ' },
    2: { emoji: '⛅', text: '一部曇り' },
    3: { emoji: '☁️', text: '曇り' },
    45: { emoji: '🌫️', text: '霧' },
    48: { emoji: '🌫️', text: '霧氷' },
    51: { emoji: '🌦️', text: '弱い霧雨' },
    53: { emoji: '🌦️', text: '霧雨' },
    55: { emoji: '🌧️', text: '強い霧雨' },
    56: { emoji: '🌧️', text: '弱い着氷性霧雨' },
    57: { emoji: '🌧️', text: '強い着氷性霧雨' },
    61: { emoji: '☔', text: '弱い雨' },
    63: { emoji: '☔', text: '雨' },
    65: { emoji: '☔', text: '強い雨' },
    66: { emoji: '🌧️', text: '弱い着氷性の雨' },
    67: { emoji: '🌧️', text: '強い着氷性の雨' },
    71: { emoji: '❄️', text: '弱い雪' },
    73: { emoji: '❄️', text: '雪' },
    75: { emoji: '❄️', text: '強い雪' },
    77: { emoji: '❄️', text: '霧雪' },
    80: { emoji: '☔', text: 'にわか雨' },
    81: { emoji: '☔', text: '強いにわか雨' },
    82: { emoji: '☔', text: '猛烈なにわか雨' },
    85: { emoji: '⛄', text: '雪見舞' },
    86: { emoji: '⛄', text: '強い雪見舞' },
    95: { emoji: '⛈️', text: '雷雨' },
    96: { emoji: '⛈️', text: '雷雨（弱雹）' },
    99: { emoji: '⛈️', text: '雷雨（強雹）' }
};

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

// ==========================================
// 状態変数
// ==========================================
let currentArticles = [];
let favoriteArticles = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVS) || '[]');
let currentFilter = 'all'; // 'all' or 'favorites'
let currentSearchQuery = '';
let todos = [];

// ==========================================
// DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initInputFocusFix();
    initSidebar();
    initFeed();
    initBackground();
    initSearch();
    initClock();
    initQuickLinks();
    initWidgetToggles();
    initApiKeys();
    initMultiAI();
    initWeatherSettings();
    initSpotify();
    initTodo();
    initCalendarTodoImport();

    // 初期データ読み込み
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL;
    loadFeed(savedUrl);
    loadWeather();

    // 保存済み背景の適用
    const savedBg = localStorage.getItem(STORAGE_KEY_BG);
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
    }
});

// ==========================================
// initInputFocusFix — Chrome拡張（New Tab）等での入力バグ・フォーカス外れ対策
// ==========================================
function initInputFocusFix() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('click', (e) => {
            e.target.focus();
        });
    });
}

// ==========================================
// initSidebar — サイドバー開閉ロジック
// ==========================================
function initSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        sidebarOverlay.classList.toggle('hidden');
    }

    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // 他のinit関数からサイドバーを閉じるために公開
    window._toggleSidebar = toggleSidebar;
}

// ==========================================
// initFeed — フィードURL読み込みと保存ボタン
// ==========================================
function initFeed() {
    const urlInput = document.getElementById('feed-url-input');
    const presetRss = document.getElementById('preset-rss');
    const saveBtn = document.getElementById('save-url-btn');

    // プリセットRSS選択時にURLを反映
    if (presetRss) {
        presetRss.addEventListener('change', () => {
            if (presetRss.value !== '') {
                urlInput.value = presetRss.value;
            }
        });
    }

    // 初期URL設定
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL;
    urlInput.value = savedUrl;

    // フィードURL保存
    saveBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            localStorage.setItem(STORAGE_KEY_URL, url);
            loadFeed(url);
            window._toggleSidebar();
        }
    });

    // モーダル閉じる
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('article-modal');
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // 背景クリックで閉じる
    });
}

// ==========================================
// initBackground — 背景画像設定（ランダム、カスタム、クリア）
// ==========================================
function initBackground() {
    const bgUrlInput = document.getElementById('bg-url-input');
    const bgFileInput = document.getElementById('bg-file-input');
    const saveBgBtn = document.getElementById('save-bg-btn');
    const clearBgBtn = document.getElementById('clear-bg-btn');
    const randomBgBtn = document.getElementById('random-bg-btn');

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

    // ランダム背景（Chrome風）
    randomBgBtn.addEventListener('click', () => {
        const randomUrl = PRESET_BACKGROUNDS[Math.floor(Math.random() * PRESET_BACKGROUNDS.length)];
        applyBackground(randomUrl);
    });

    // 背景の適用
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

    // 背景のクリア
    clearBgBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_BG);
        document.body.style.backgroundImage = '';
        bgUrlInput.value = '';
        bgFileInput.value = '';
    });
}

// ==========================================
// initSearch — 検索入力とタブフィルタリング
// ==========================================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favorites');

    // 検索
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        renderArticles();
    });

    // タブ切り替え
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
// initClock — 時計ウィジェット
// ==========================================
function initClock() {
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
}

// ==========================================
// initQuickLinks — クイックリンクウィジェット
// ==========================================
function initQuickLinks() {
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
}

// ==========================================
// initWidgetToggles — ウィジェット表示トグル
// ==========================================
function initWidgetToggles() {
    const toggles = [
        { id: 'toggle-clock', targetClass: 'clock-widget' },
        { id: 'toggle-weather', targetId: 'weather-widget' },
        { id: 'toggle-todo', targetId: 'todo-widget' },
        { id: 'toggle-spotify', targetId: 'spotify-widget' },
        { id: 'toggle-links', targetClass: 'quick-links-widget' },
        { id: 'toggle-ai-openai', targetId: 'ai-panel-openai' },
        { id: 'toggle-ai-anthropic', targetId: 'ai-panel-anthropic' },
        { id: 'toggle-ai-gemini', targetId: 'ai-panel-gemini' }
    ];

    toggles.forEach(t => {
        const checkbox = document.getElementById(t.id);
        if (!checkbox) return;

        // Load state
        const stored = localStorage.getItem(t.id);
        if (stored !== null) checkbox.checked = stored === 'true';

        // Apply state function
        const applyToggle = () => {
            const isVisible = checkbox.checked;
            if (t.targetClass) {
                document.querySelectorAll('.' + t.targetClass).forEach(el => el.classList.toggle('hidden-widget', !isVisible));
            } else if (t.targetId) {
                const el = document.getElementById(t.targetId);
                if (el) el.classList.toggle('hidden-widget', !isVisible);
            }
        };
        applyToggle();

        // Event listener
        checkbox.addEventListener('change', () => {
            localStorage.setItem(t.id, checkbox.checked);
            applyToggle();
        });
    });
}

// ==========================================
// initApiKeys — APIキー管理
// ==========================================
function initApiKeys() {
    const keys = ['openai', 'anthropic', 'gemini'];
    const apiKeys = {};

    function updateBoxStatus() {
        if (apiKeys.openai) {
            const b = document.getElementById('chatbox-openai');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">OpenAIの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
        if (apiKeys.anthropic) {
            const b = document.getElementById('chatbox-anthropic');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Claudeの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
        if (apiKeys.gemini) {
            const b = document.getElementById('chatbox-gemini');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Geminiの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
    }

    keys.forEach(k => {
        const input = document.getElementById(`${k}-api-key`);
        if (input) {
            const val = localStorage.getItem(`custom_${k}_api_key`) || '';
            input.value = val;
            apiKeys[k] = val;
        }
    });

    updateBoxStatus();

    const saveKeysBtn = document.getElementById('save-keys-btn');
    if (saveKeysBtn) {
        saveKeysBtn.addEventListener('click', () => {
            keys.forEach(k => {
                const input = document.getElementById(`${k}-api-key`);
                if (input) {
                    const val = input.value.trim();
                    localStorage.setItem(`custom_${k}_api_key`, val);
                    apiKeys[k] = val;
                }
            });
            updateBoxStatus();
            alert('APIキーを保存しました！');
            window._toggleSidebar();
        });
    }

    // apiKeysオブジェクトをマルチAI機能から参照するために公開
    window._apiKeys = apiKeys;
}

// ==========================================
// initMultiAI — AIチャット送信機能
// ==========================================
function initMultiAI() {
    const aiGlobalInput = document.getElementById('ai-global-input');
    const aiGlobalSendBtn = document.getElementById('ai-global-send-btn');

    function formatMarkdown(text) {
        return text.replace(/\n/g, '<br>')
                   .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function addChatMessageToBox(boxId, text, sender) {
        const box = document.getElementById(boxId);
        if (!box) return;

        // APIキー催促メッセージなどをクリア
        if (box.innerHTML.includes('APIキーを設定してください')) {
            box.innerHTML = '';
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}-msg`;
        msgDiv.innerHTML = formatMarkdown(text);
        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
        return msgDiv; // ローディング用に戻り値
    }

    async function fetchOpenAI(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.openai) {
            addChatMessageToBox(boxId, 'エラー: OpenAI APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.choices[0].message.content, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    async function fetchAnthropic(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.anthropic) {
            addChatMessageToBox(boxId, 'エラー: Anthropic APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKeys.anthropic,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.content[0].text, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    async function fetchGemini(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.gemini) {
            addChatMessageToBox(boxId, 'エラー: Gemini APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKeys.gemini}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.candidates[0].content.parts[0].text, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    window.sendToAI = async function(prompt) {
        if (!prompt) return;

        const isOpenAIVisible = document.getElementById('toggle-ai-openai')?.checked;
        const isAnthropicVisible = document.getElementById('toggle-ai-anthropic')?.checked;
        const isGeminiVisible = document.getElementById('toggle-ai-gemini')?.checked;

        if (!isOpenAIVisible && !isAnthropicVisible && !isGeminiVisible) {
            alert('表示されているAIモデルがありません。設定から表示をONにしてください。');
            return;
        }

        if (isOpenAIVisible) addChatMessageToBox('chatbox-openai', prompt, 'user');
        if (isAnthropicVisible) addChatMessageToBox('chatbox-anthropic', prompt, 'user');
        if (isGeminiVisible) addChatMessageToBox('chatbox-gemini', prompt, 'user');

        aiGlobalInput.value = '';
        aiGlobalSendBtn.disabled = true;

        const promises = [];
        if (isOpenAIVisible) promises.push(fetchOpenAI(prompt, 'chatbox-openai'));
        if (isAnthropicVisible) promises.push(fetchAnthropic(prompt, 'chatbox-anthropic'));
        if (isGeminiVisible) promises.push(fetchGemini(prompt, 'chatbox-gemini'));

        await Promise.all(promises);
        aiGlobalSendBtn.disabled = false;
    };

    if (aiGlobalSendBtn) {
        aiGlobalSendBtn.addEventListener('click', () => {
            window.sendToAI(aiGlobalInput.value.trim());
        });
    }

    if (aiGlobalInput) {
        aiGlobalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.sendToAI(aiGlobalInput.value.trim());
            }
        });
    }
}

// ==========================================
// フィードの取得と解析
// ==========================================
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

// ==========================================
// 記事の描画処理（検索とフィルタ対応）
// ==========================================
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

    // 画面全体スクロールなので多めに表示
    const MAX_ITEMS = 20;
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
                <button class="ai-summary-btn" title="この記事をAIで要約">要約</button>
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
            window.sendToAI(prompt);
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
    localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favoriteArticles));
}

// ==========================================
// モーダルで記事プレビューを開く
// ==========================================
function openModal(article) {
    document.getElementById('modal-title').textContent = article.title;

    // iframeや不要なスクリプト等を除去したい場合はここでサニタイズ処理を入れることができます
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

    // 少し遅延させてから中身をクリア（フェードアウトアニメーション待ち）
    setTimeout(() => {
        document.getElementById('modal-body').innerHTML = '';
    }, 300);
}

// ==========================================
// Open-Meteo APIから天気・降水確率情報を取得して描画する
// ==========================================
async function loadWeather() {
    const weatherWidget = document.getElementById('weather-widget');
    if (!weatherWidget) return;

    try {
        const location = getStoredWeatherLocation();
        const meteoRes = await fetch(buildWeatherForecastUrl(location));
        if (!meteoRes.ok) throw new Error('HTTP Error');
        const meteoData = await meteoRes.json();
        weatherWidget.innerHTML = renderWeatherWidget(location.name, meteoData);
    } catch (e) {
        console.error(e);
        weatherWidget.innerHTML = '<div class="weather-error">天気情報の取得に失敗しました</div>';
    }
}

function initWeatherSettings() {
    const cityInput = document.getElementById('weather-city-input');
    const cityButton = document.getElementById('weather-city-btn');
    const status = document.getElementById('weather-city-status');

    updateWeatherCityStatus(status);

    if (cityButton && cityInput) {
        cityButton.addEventListener('click', () => handleWeatherCitySearch(cityInput, status));
    }
}

function updateWeatherCityStatus(status) {
    if (!status) return;
    status.textContent = `現在: ${getStoredWeatherLocation().name}`;
}

function resetWeatherCityStatus(status) {
    setTimeout(() => updateWeatherCityStatus(status), WEATHER_STATUS_RESET_DELAY_MS);
}

async function handleWeatherCitySearch(input, status) {
    const query = input.value.trim();
    if (!query) return;

    setWeatherStatus(status, '検索中...');
    try {
        const location = await fetchWeatherLocationByCity(query);
        if (!location) {
            setWeatherStatus(status, '見つかりませんでした');
            resetWeatherCityStatus(status);
            return;
        }

        saveWeatherLocation(location);
        input.value = '';
        updateWeatherCityStatus(status);
        loadWeather();
    } catch (e) {
        setWeatherStatus(status, 'エラーが発生しました');
        resetWeatherCityStatus(status);
    }
}

function setWeatherStatus(status, message) {
    if (status) status.textContent = message;
}

async function fetchWeatherLocationByCity(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=ja&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    return {
        lat: String(result.latitude),
        lon: String(result.longitude),
        name: result.name + (result.admin1 ? `, ${result.admin1}` : '')
    };
}

function saveWeatherLocation({ lat, lon, name }) {
    localStorage.setItem(WEATHER_STORAGE_KEYS.lat, lat);
    localStorage.setItem(WEATHER_STORAGE_KEYS.lon, lon);
    localStorage.setItem(WEATHER_STORAGE_KEYS.name, name);
}

function getStoredWeatherLocation() {
    return {
        lat: localStorage.getItem(WEATHER_STORAGE_KEYS.lat) || DEFAULT_WEATHER_LOCATION.lat,
        lon: localStorage.getItem(WEATHER_STORAGE_KEYS.lon) || DEFAULT_WEATHER_LOCATION.lon,
        name: localStorage.getItem(WEATHER_STORAGE_KEYS.name) || DEFAULT_WEATHER_LOCATION.name
    };
}

function buildWeatherForecastUrl({ lat, lon }) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current_weather: 'true',
        hourly: 'precipitation_probability',
        timezone: 'Asia/Tokyo',
        models: 'jma_seamless'
    });

    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function renderWeatherWidget(locationName, meteoData) {
    const current = meteoData.current_weather;
    const weather = WMO_WEATHER[current.weathercode] || { emoji: '🌡️', text: '不明' };
    const chartHTML = renderWeatherChart(
        meteoData.hourly.time,
        meteoData.hourly.precipitation_probability
    );

    return `
        <div style="display:flex; align-items:center; gap: 16px;">
            <div class="weather-icon-container">${weather.emoji}</div>
            <div class="weather-info">
                <div class="weather-area">${formatWeatherLocationName(locationName)}</div>
                <div class="weather-temp-container">
                    <span class="weather-desc">${weather.text}</span>
                    <span class="weather-rain" style="margin-left: 8px;">${current.temperature}℃</span>
                </div>
            </div>
        </div>
        ${chartHTML}
    `;
}

function renderWeatherChart(times, precipitationProbabilities) {
    const startIndex = findForecastStartIndex(times);
    const chartItems = [];

    for (let i = 0; i < WEATHER_CHART_HOURS; i++) {
        const index = startIndex + i;
        if (index >= times.length) break;

        const probability = precipitationProbabilities[index] || 0;
        const hour = new Date(times[index]).getHours().toString().padStart(2, '0');
        const height = getWeatherChartBarHeight(probability);
        const opacity = probability > 0 ? 1 : 0.3;

        chartItems.push(`
            <div class="weather-chart-bar-wrap">
                <span class="weather-chart-val">${probability}</span>
                <div class="weather-chart-bar" style="height: ${height}px; opacity: ${opacity};"></div>
                <span class="weather-chart-label">${hour}</span>
            </div>
        `);
    }

    return `<div class="weather-chart-container">${chartItems.join('')}</div>`;
}

function findForecastStartIndex(times) {
    const oneHourAgo = Date.now() - 3600000;
    const index = times.findIndex(time => new Date(time).getTime() >= oneHourAgo);
    return index === -1 ? 0 : index;
}

function getWeatherChartBarHeight(probability) {
    if (probability <= 0) return WEATHER_CHART_EMPTY_BAR_HEIGHT;
    return Math.max(
        WEATHER_CHART_BAR_MIN_HEIGHT,
        (probability / 100) * WEATHER_CHART_BAR_MAX_HEIGHT
    );
}

function formatWeatherLocationName(name) {
    return name.split(',')[0];
}

// ==========================================
// Spotify 機能
// ==========================================
const SPOTIFY_CLIENT_ID = '3ed94377fd3840f2b3f3e88967a2ed78';
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

let spotifyPollInterval = null;

function initSpotify() {
    const loginBtn = document.getElementById('spotify-login-btn');
    const logoutBtn = document.getElementById('spotify-logout-btn');
    if(!loginBtn) return;

    const token = localStorage.getItem('spotify_access_token');
    if (token) {
        showSpotifyPlayer(true);
        startSpotifyPolling();
    } else {
        showSpotifyPlayer(false);
    }

    loginBtn.addEventListener('click', authenticateSpotify);
    logoutBtn.addEventListener('click', logoutSpotify);

    document.getElementById('spotify-play-btn').addEventListener('click', toggleSpotifyPlay);
    document.getElementById('spotify-next-btn').addEventListener('click', () => controlSpotify('next', 'POST'));
    document.getElementById('spotify-prev-btn').addEventListener('click', () => controlSpotify('previous', 'POST'));
}

// ==========================================
// Spotify API / PKCE Auth Helpers
// ==========================================
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function authenticateSpotify() {
    // chrome.identity.launchWebAuthFlow が使える環境（Chrome拡張）かチェック
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        alert("Chrome拡張機能として動作していないか、manifest.jsonにidentity権限がありません。");
        return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    console.log("Spotify Redirect URI:", redirectUri);

    // PKCE用のコードを生成
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}&show_dialog=true`;

    chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    }, async function(redirectUrl) {
        if (chrome.runtime.lastError || !redirectUrl) {
            console.error("Auth Error:", chrome.runtime.lastError);
            alert("Spotifyの認証がキャンセルされたか失敗しました。\n詳細: " + (chrome.runtime.lastError?.message || ""));
            return;
        }

        // redirectUrl: https://.../?code=AQD...
        const urlObj = new URL(redirectUrl);
        const code = urlObj.searchParams.get('code');
        if (!code) {
            alert("認証コードが取得できませんでした。");
            return;
        }

        // Tokenの取得 (PKCE Authorization Code Flow)
        try {
            const body = new URLSearchParams({
                client_id: SPOTIFY_CLIENT_ID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            });

            const res = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            });

            if (!res.ok) {
                const errJson = await res.json();
                console.error("Token Error:", errJson);
                alert("トークンの取得に失敗しました。");
                return;
            }

            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('spotify_access_token', data.access_token);
                showSpotifyPlayer(true);
                startSpotifyPolling();
            }
        } catch(e) {
            console.error(e);
            alert("トークン取得時にエラーが発生しました。");
        }
    });
}

function logoutSpotify() {
    localStorage.removeItem('spotify_access_token');
    stopSpotifyPolling();
    showSpotifyPlayer(false);
}

function showSpotifyPlayer(isLoggedIn) {
    document.getElementById('spotify-login-btn').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-logout-btn').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('spotify-auth-prompt').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-player-container').style.display = isLoggedIn ? 'flex' : 'none';
}

function startSpotifyPolling() {
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    fetchSpotifyCurrentlyPlaying();
    spotifyPollInterval = setInterval(fetchSpotifyCurrentlyPlaying, 5000);
}

function stopSpotifyPolling() {
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
}

async function fetchSpotifyCurrentlyPlaying() {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;

    try {
        const res = await fetch('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            // トークン期限切れ
            logoutSpotify();
            return;
        }

        if (res.status === 204 || res.status === 202) {
            // 再生されていない
            updateSpotifyUI(null);
            return;
        }

        const data = await res.json();
        updateSpotifyUI(data);
    } catch(e) {
        console.error("Spotify Fetch Error:", e);
    }
}

function updateSpotifyUI(data) {
    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    const artEl = document.getElementById('spotify-art');
    const playBtn = document.getElementById('spotify-play-btn');

    if (!data || !data.item) {
        trackEl.textContent = 'デバイスで再生されていません';
        artistEl.textContent = '-';
        artEl.src = '';
        playBtn.textContent = '▶️';
        return;
    }

    trackEl.textContent = data.item.name;
    artistEl.textContent = data.item.artists.map(a => a.name).join(', ');
    if (data.item.album && data.item.album.images.length > 0) {
        artEl.src = data.item.album.images[0].url;
    }

    if (data.is_playing) {
        playBtn.textContent = '⏸';
    } else {
        playBtn.textContent = '▶️';
    }
}

async function controlSpotify(action, method = 'PUT') {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    try {
        await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setTimeout(fetchSpotifyCurrentlyPlaying, 500); // すぐに状態を更新
    } catch(e) {
        console.error(e);
    }
}

async function toggleSpotifyPlay() {
    const playBtn = document.getElementById('spotify-play-btn');
    const isPlaying = playBtn.textContent === '⏸';
    await controlSpotify(isPlaying ? 'pause' : 'play', 'PUT');
}

// ==========================================
// Todo 機能
// ==========================================
function initTodo() {
    todos = readTodos();
    renderTodos();

    const input = document.getElementById('todo-input');
    const btn = document.getElementById('todo-add-btn');
    if (input && btn) {
        btn.addEventListener('click', () => addTodo(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo(input.value);
        });
    }
}

function initCalendarTodoImport() {
    const urlInput = document.getElementById('calendar-ical-url-input');
    const lookaheadSelect = document.getElementById('calendar-lookahead-select');
    const saveButton = document.getElementById('calendar-save-btn');
    const syncButton = document.getElementById('calendar-sync-btn');
    const widgetImportButton = document.getElementById('calendar-import-btn');
    const status = document.getElementById('calendar-import-status');

    if (!urlInput || !lookaheadSelect || !saveButton || !syncButton) return;

    urlInput.value = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    lookaheadSelect.value = localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS) || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS);
    updateCalendarImportStatus(status);

    saveButton.addEventListener('click', () => {
        saveCalendarImportSettings(urlInput.value, lookaheadSelect.value);
        updateCalendarImportStatus(status, '保存しました');
    });

    syncButton.addEventListener('click', () => importCalendarEventsToTodos(status));

    if (widgetImportButton) {
        widgetImportButton.addEventListener('click', () => importCalendarEventsToTodos(status));
    }
}

function saveCalendarImportSettings(icalUrl, lookaheadDays) {
    localStorage.setItem(STORAGE_KEY_CALENDAR_ICAL_URL, icalUrl.trim());
    localStorage.setItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS, String(parseCalendarLookaheadDays(lookaheadDays)));
}

function updateCalendarImportStatus(status, message) {
    if (!status) return;

    if (message) {
        status.textContent = message;
        return;
    }

    const icalUrl = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    status.textContent = icalUrl ? '設定済み' : '未設定';
}

async function importCalendarEventsToTodos(status) {
    const icalUrl = getCalendarIcalUrlFromSettings();
    if (!icalUrl) {
        updateCalendarImportStatus(status, 'iCal URLを設定してください');
        return;
    }

    updateCalendarImportStatus(status, '予定を取得中...');

    try {
        const events = await fetchGoogleCalendarEvents(icalUrl);
        const importableEvents = filterImportableCalendarEvents(events);
        const result = addCalendarEventsToTodos(importableEvents);
        updateCalendarImportStatus(status, `${result.added}件追加 / ${result.skipped}件スキップ`);
    } catch (e) {
        console.error(e);
        updateCalendarImportStatus(status, '予定の取得に失敗しました');
    }
}

function getCalendarIcalUrlFromSettings() {
    const input = document.getElementById('calendar-ical-url-input');
    const select = document.getElementById('calendar-lookahead-select');

    if (input || select) {
        saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS));
    }

    return localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
}

async function fetchGoogleCalendarEvents(icalUrl) {
    const res = await fetch(icalUrl);
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);

    const icsText = await res.text();
    return parseIcsEvents(icsText);
}

function filterImportableCalendarEvents(events) {
    const lookaheadDays = parseCalendarLookaheadDays(localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS));
    const rangeStart = startOfToday();
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + lookaheadDays);

    return events
        .filter(event => event.start && event.start >= rangeStart && event.start < rangeEnd)
        .sort((a, b) => a.start - b.start)
        .slice(0, MAX_CALENDAR_TODO_IMPORTS);
}

function addCalendarEventsToTodos(events) {
    let added = 0;
    let skipped = 0;

    events.forEach(event => {
        if (hasCalendarTodo(event.id)) {
            skipped += 1;
            return;
        }

        todos.push({
            text: formatCalendarTodoText(event),
            completed: false,
            source: 'google-calendar',
            calendarEventId: event.id,
            calendarStart: event.start.toISOString()
        });
        added += 1;
    });

    if (added > 0) {
        saveTodos();
        renderTodos();
    }

    return { added, skipped };
}

function hasCalendarTodo(calendarEventId) {
    return todos.some(todo => todo.source === 'google-calendar' && todo.calendarEventId === calendarEventId);
}

function formatCalendarTodoText(event) {
    return `${formatCalendarEventStart(event.start, event.isAllDay)} ${event.summary}`;
}

function formatCalendarEventStart(date, isAllDay) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });

    if (isAllDay) {
        return `${month}/${day}(${weekday})`;
    }

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}(${weekday}) ${hour}:${minute}`;
}

function parseCalendarLookaheadDays(value) {
    const days = Number.parseInt(value, 10);
    if (![3, 7, 14, 30].includes(days)) return DEFAULT_CALENDAR_LOOKAHEAD_DAYS;
    return days;
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function parseIcsEvents(icsText) {
    const events = [];
    let currentEvent = null;

    unfoldIcsLines(icsText).forEach(line => {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            return;
        }

        if (line === 'END:VEVENT') {
            const event = normalizeIcsEvent(currentEvent);
            if (event) events.push(event);
            currentEvent = null;
            return;
        }

        if (!currentEvent) return;

        const property = parseIcsProperty(line);
        if (!property) return;

        currentEvent[property.name] = property;
    });

    return events;
}

function unfoldIcsLines(icsText) {
    return icsText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .reduce((lines, line) => {
            if (/^[ \t]/.test(line) && lines.length > 0) {
                lines[lines.length - 1] += line.slice(1);
            } else {
                lines.push(line);
            }
            return lines;
        }, []);
}

function parseIcsProperty(line) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return null;

    const rawName = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name, ...paramParts] = rawName.split(';');

    return {
        name: name.toUpperCase(),
        params: parseIcsParams(paramParts),
        value
    };
}

function parseIcsParams(paramParts) {
    return paramParts.reduce((params, part) => {
        const [key, value] = part.split('=');
        if (key && value) params[key.toUpperCase()] = value.replace(/^"|"$/g, '');
        return params;
    }, {});
}

function normalizeIcsEvent(rawEvent) {
    if (!rawEvent?.DTSTART) return null;

    const start = parseIcsDate(rawEvent.DTSTART);
    if (!start.date) return null;

    const uid = unescapeIcsText(rawEvent.UID?.value || `${rawEvent.SUMMARY?.value || 'event'}-${rawEvent.DTSTART.value}`);

    return {
        id: uid,
        summary: unescapeIcsText(rawEvent.SUMMARY?.value || '予定'),
        start: start.date,
        isAllDay: start.isAllDay
    };
}

function parseIcsDate(property) {
    const value = property.value;
    const isDateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);

    if (isDateOnly) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6)) - 1;
        const day = Number(value.slice(6, 8));
        return { date: new Date(year, month, day), isAllDay: true };
    }

    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) return { date: null, isAllDay: false };

    const [, year, month, day, hour, minute, second, utcSuffix] = match;
    const date = utcSuffix
        ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
        : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

    return { date, isAllDay: false };
}

function unescapeIcsText(text) {
    return text
        .replace(/\\n/gi, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}

function readTodos() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_TODOS) || '[]');
    } catch (e) {
        return [];
    }
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            saveTodos();
            renderTodos();
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        const textWrap = document.createElement('div');
        textWrap.className = 'todo-text-wrap';
        textWrap.appendChild(span);

        if (todo.source === 'google-calendar') {
            const meta = document.createElement('span');
            meta.className = 'todo-meta';
            meta.textContent = 'Googleカレンダー';
            textWrap.appendChild(meta);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'todo-delete-btn';
        delBtn.innerHTML = '×';
        delBtn.addEventListener('click', () => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        });

        li.appendChild(checkbox);
        li.appendChild(textWrap);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addTodo(text) {
    const todoText = text.trim();
    if (!todoText) return;

    todos.unshift({ text: todoText, completed: false });
    saveTodos();
    renderTodos();

    const input = document.getElementById('todo-input');
    if (input) input.value = '';
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
}
