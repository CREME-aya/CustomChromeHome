// ==========================================
// initThemeSettings — UIテーマの切り替え
// ==========================================
(function() {
window.initThemeSettings = initThemeSettings;

function initThemeSettings() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;

    // セレクト表示とHTMLルートのクラスを同じ保存値から復元する。
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', (e) => {
        // テーマCSSは documentElement のクラスで一括切り替えする。
        const theme = e.target.value;
        document.documentElement.className = theme;
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    });
}
})();
