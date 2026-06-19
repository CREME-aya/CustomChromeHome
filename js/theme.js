// ==========================================
// initThemeSettings — UIテーマの切り替え
// ==========================================
function initThemeSettings() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;

    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.className = theme;
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    });
}
