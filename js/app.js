// ==========================================
// アプリ全体のエントリーポイント (堅牢化版)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 各モジュールの初期化を安全に実行するヘルパー
    // 1つのウィジェットのエラーが他の無関係な機能（時計、天気など）の初期化を妨げないようにする
    const safeInit = (name, initFn) => {
        try {
            if (typeof initFn === 'function') {
                initFn();
            } else {
                console.warn(`[Warn] Initialization function for "${name}" is not registered or failed to load.`);
            }
        } catch (e) {
            console.error(`[Error] Failed to initialize ${name}:`, e);
        }
    };

    safeInit('InputFocusFix', window.initInputFocusFix);
    safeInit('Sidebar', window.initSidebar);
    safeInit('Feed', window.initFeed);
    safeInit('Background', window.initBackground);
    safeInit('Search', window.initSearch);
    safeInit('Clock', window.initClock);
    safeInit('QuickLinks', window.initQuickLinks);
    safeInit('WidgetToggles', window.initWidgetToggles);
    safeInit('ApiKeys', window.initApiKeys);
    safeInit('MultiAI', window.initMultiAI);
    safeInit('ThemeSettings', window.initThemeSettings);
    safeInit('WidgetSortable', window.initWidgetSortable);
    safeInit('WeatherSettings', window.initWeatherSettings);
    safeInit('Spotify', window.initSpotify);
    safeInit('Todo', window.initTodo);
    safeInit('CalendarTodoImport', window.initCalendarTodoImport);

    // Google / GitHub / 拡張ウィジェットの初期化
    const safeMethodInit = (name, obj, method) => {
        try {
            if (obj && typeof obj[method] === 'function') {
                obj[method]();
            } else if (!obj) {
                console.warn(`[Warn] Global object "${name}" is not defined.`);
            } else {
                console.warn(`[Warn] Method "${method}" on "${name}" is not defined.`);
            }
        } catch (e) {
            console.error(`[Error] Failed to initialize Google/GitHub ${name}.${method}:`, e);
        }
    };

    safeMethodInit('GoogleAuth', window.GoogleAuth, 'initSettings');
    safeMethodInit('GoogleCalendar', window.GoogleCalendar, 'init');
    safeMethodInit('GoogleTasks', window.GoogleTasks, 'init');
    safeMethodInit('Gmail', window.Gmail, 'init');
    safeMethodInit('GitHub', window.GitHub, 'init');

    safeInit('GoogleFit', window.initGoogleFit);
    safeInit('GithubGrass', window.initGithubGrass);
    safeInit('MediaController', window.initMediaController);

    // 初期データのロード
    safeInit('LoadFeed', () => {
        if (typeof window.loadFeed === 'function') {
            window.loadFeed(window.getStoredFeedUrls ? window.getStoredFeedUrls() : []);
        }
    });
    
    safeInit('LoadWeather', () => {
        if (typeof window.loadWeather === 'function') {
            window.loadWeather();
        }
    });

    // テーマの適用
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
        document.documentElement.className = savedTheme;
    } catch (e) {
        console.error("Failed to apply theme:", e);
    }
});
