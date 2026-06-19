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
    initThemeSettings();
    initWidgetSortable();
    initWeatherSettings();
    initSpotify();
    initTodo();
    initCalendarTodoImport();

    // 初期データ読み込み
    loadFeed(getStoredFeedUrls());
    loadWeather();

    // 保存済みテーマの適用
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    document.documentElement.className = savedTheme;
});
