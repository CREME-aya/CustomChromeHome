// ==========================================
// アプリ全体のエントリーポイント
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 各モジュールは DOM 構築後に必要な要素へイベントを配線する。
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
    initThemeSettings();
    initWidgetSortable();
    initWeatherSettings();
    initSpotify();
    initTodo();
    initCalendarTodoImport();

    // 起動時に保存済み設定を使って外部データを読み込む。
    loadFeed(getStoredFeedUrls());
    loadWeather();

    // 保存済みテーマがなければ標準のガラス風ダークテーマを使う。
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    document.documentElement.className = savedTheme;
});
