// ==========================================
// initWidgetToggles — ウィジェット表示トグル
// ==========================================
(function() {
window.initWidgetToggles = initWidgetToggles;

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

        // 保存済みの表示状態をチェックボックスへ復元する。
        const stored = localStorage.getItem(t.id);
        if (stored !== null) checkbox.checked = stored === 'true';

        // id指定とclass指定の両方に対応し、単体/複数ウィジェットを同じ処理で扱う。
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

        // 変更時は表示状態を保存して、次回起動時にも同じ状態を再現する。
        checkbox.addEventListener('change', () => {
            localStorage.setItem(t.id, checkbox.checked);
            applyToggle();
        });
    });
}
})();
