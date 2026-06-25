// ==========================================
// アプリ全体のエントリーポイント
// ==========================================
// 詳細: ページ全体のイベントを監視して、初期化や操作処理を開始する。
document.addEventListener('DOMContentLoaded', () => {
    // 各モジュールは DOM 構築後に必要な要素へイベントを配線する。
    // 詳細: 次の処理行「initInputFocusFix();」の役割を、その場の制御フローに組み込む。
    initInputFocusFix();
    // 詳細: 次の処理行「initSidebar();」の役割を、その場の制御フローに組み込む。
    initSidebar();
    // 詳細: 次の処理行「initFeed();」の役割を、その場の制御フローに組み込む。
    initFeed();
    // 詳細: 次の処理行「initBackground();」の役割を、その場の制御フローに組み込む。
    initBackground();
    // 詳細: 次の処理行「initSearch();」の役割を、その場の制御フローに組み込む。
    initSearch();
    // 詳細: 次の処理行「initClock();」の役割を、その場の制御フローに組み込む。
    initClock();
    // 詳細: 次の処理行「initQuickLinks();」の役割を、その場の制御フローに組み込む。
    initQuickLinks();
    // 詳細: 次の処理行「initWidgetToggles();」の役割を、その場の制御フローに組み込む。
    initWidgetToggles();
    // 詳細: 次の処理行「initApiKeys();」の役割を、その場の制御フローに組み込む。
    initApiKeys();
    // 詳細: 次の処理行「initMultiAI();」の役割を、その場の制御フローに組み込む。
    initMultiAI();
    // 詳細: 次の処理行「initThemeSettings();」の役割を、その場の制御フローに組み込む。
    initThemeSettings();
    // 詳細: 次の処理行「initWidgetSortable();」の役割を、その場の制御フローに組み込む。
    initWidgetSortable();
    // 詳細: 次の処理行「initWeatherSettings();」の役割を、その場の制御フローに組み込む。
    initWeatherSettings();
    // 詳細: 次の処理行「initSpotify();」の役割を、その場の制御フローに組み込む。
    initSpotify();
    // 詳細: 次の処理行「initTodo();」の役割を、その場の制御フローに組み込む。
    initTodo();
    // 詳細: 次の処理行「initCalendarTodoImport();」の役割を、その場の制御フローに組み込む。
    initCalendarTodoImport();

    // Google / GitHub ウィジェットの初期化
    if (window.GoogleAuth) window.GoogleAuth.initSettings();
    if (window.GoogleCalendar) window.GoogleCalendar.init();
    if (window.GoogleTasks) window.GoogleTasks.init();
    if (window.Gmail) window.Gmail.init();
    if (window.GitHub) window.GitHub.init();

    // 起動時に保存済み設定を使って外部データを読み込む。
    // 詳細: 次の処理行「loadFeed(getStoredFeedUrls());」の役割を、その場の制御フローに組み込む。
    loadFeed(getStoredFeedUrls());
    // 詳細: 次の処理行「loadWeather();」の役割を、その場の制御フローに組み込む。
    loadWeather();

    // 保存済みテーマがなければ標準のガラス風ダークテーマを使う。
    // 詳細: 変数「savedTheme」を、この後の処理で使う値として用意する。
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    // 詳細: 次の処理行「document.documentElement.className = savedTheme;」の役割を、その場の制御フローに組み込む。
    document.documentElement.className = savedTheme;
// 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
});
