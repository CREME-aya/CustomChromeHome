// ==========================================
// アプリ全体のエントリーポイント (堅牢化版)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    /**
     * 初期化エラーをコンソールに報告する
     *
     * @param {string} name - 初期化に失敗したモジュール名
     * @param {Error|any} error - 発生したエラー
     */
    const reportInitializationError = (name, error) => {
        console.error(`[Error] Failed to initialize ${name}:`, error);
    };

    /**
     * 初期化対象の一覧（この順番で実行する）
     * resolve は実行時にグローバルから初期化関数を取り出す。
     * 未定義なら警告だけ出して次へ進み、1つの失敗が他のウィジェットを止めないようにする。
     *
     * @type {Array<{name: string, resolve: () => (Function|undefined)}>}
     */
    const bindMethod = (obj, method) => (obj && typeof obj[method] === 'function')
        ? obj[method].bind(obj)
        : undefined;

    const modules = [
        { name: 'InputFocusFix', resolve: () => window.initInputFocusFix },
        { name: 'Sidebar', resolve: () => window.initSidebar },
        { name: 'Feed', resolve: () => window.initFeed },
        { name: 'Background', resolve: () => window.initBackground },
        { name: 'Search', resolve: () => window.initSearch },
        { name: 'Clock', resolve: () => window.initClock },
        { name: 'QuickLinks', resolve: () => window.initQuickLinks },
        { name: 'WidgetToggles', resolve: () => window.initWidgetToggles },
        { name: 'ApiKeys', resolve: () => window.initApiKeys },
        { name: 'ApiDiagnostics', resolve: () => bindMethod(window.ApiDiagnostics, 'init') },
        { name: 'MultiAI', resolve: () => window.initMultiAI },
        { name: 'ThemeSettings', resolve: () => window.initThemeSettings },
        { name: 'WidgetSortable', resolve: () => window.initWidgetSortable },
        { name: 'WeatherSettings', resolve: () => window.initWeatherSettings },
        { name: 'Spotify', resolve: () => window.initSpotify },
        { name: 'Todo', resolve: () => window.initTodo },
        { name: 'CalendarTodoImport', resolve: () => window.initCalendarTodoImport },
        { name: 'UnifiedAgenda', resolve: () => bindMethod(window.UnifiedAgenda, 'init') },
        { name: 'GoogleAuth.initSettings', resolve: () => bindMethod(window.GoogleAuth, 'initSettings') },
        { name: 'GoogleCalendar.init', resolve: () => bindMethod(window.GoogleCalendar, 'init') },
        { name: 'GoogleTasks.init', resolve: () => bindMethod(window.GoogleTasks, 'init') },
        { name: 'Gmail.init', resolve: () => bindMethod(window.Gmail, 'init') },
        { name: 'GitHub.init', resolve: () => bindMethod(window.GitHub, 'init') },
        { name: 'GithubGrass', resolve: () => window.initGithubGrass },
        { name: 'MediaController', resolve: () => window.initMediaController },
        { name: 'Stocks', resolve: () => bindMethod(window.StocksWidget, 'init') },
        // 初期データのロード（未定義なら何もしない。戻り値は待たない）
        {
            name: 'LoadFeed',
            resolve: () => () => {
                if (typeof window.loadFeed === 'function') {
                    window.loadFeed(window.getStoredFeedUrls ? window.getStoredFeedUrls() : []);
                }
            }
        },
        {
            name: 'LoadWeather',
            resolve: () => () => {
                if (typeof window.loadWeather === 'function') {
                    window.loadWeather();
                }
            }
        }
    ];

    /**
     * 1つのモジュールを安全に初期化する
     * 同期の例外も async の reject も、モジュール名付きで記録する。
     *
     * @param {{name: string, resolve: Function}} module - 初期化対象
     */
    const safeInit = ({ name, resolve }) => {
        try {
            const initFn = resolve();
            if (typeof initFn !== 'function') {
                console.warn(`[Warn] Initialization function for "${name}" is not registered or failed to load.`);
                return;
            }
            const result = initFn();
            if (result && typeof result.catch === 'function') {
                result.catch(error => reportInitializationError(name, error));
            }
        } catch (e) {
            reportInitializationError(name, e);
        }
    };

    // .env の読み込みを待ってから初期化する（失敗しても初期化は続ける）
    if (window.EnvConfig?.ready) {
        try {
            await window.EnvConfig.ready;
        } catch (error) {
            reportInitializationError('EnvConfig', error);
        }
    }

    modules.forEach(safeInit);

    // テーマの適用
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
        document.documentElement.className = savedTheme;
    } catch (e) {
        console.error("Failed to apply theme:", e);
    }
});
