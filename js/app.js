// ==========================================
// App entry point
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

    // Initial data loading
    loadFeed(getStoredFeedUrls());
    loadWeather();

    // Apply saved theme.
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    document.documentElement.className = savedTheme;
});
