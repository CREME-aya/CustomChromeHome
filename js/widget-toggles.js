/**
 * @fileoverview ウィジェット表示トグル機能
 */
(function() {
window.initWidgetToggles = initWidgetToggles;

/**
 * 各ウィジェットの表示/非表示を切り替えるトグルを初期化する
 */
function initWidgetToggles() {
    const toggles = [
        { id: 'toggle-clock', targetClass: 'clock-widget' },
        { id: 'toggle-weather', targetId: 'weather-widget' },
        { id: 'toggle-todo', targetId: 'todo-widget' },
        { id: 'toggle-unified-agenda', targetId: 'unified-agenda-widget' },
        { id: 'toggle-spotify', targetId: 'spotify-widget' },
        { id: 'toggle-links', targetClass: 'quick-links-widget' },
        { id: 'toggle-ai-openai', targetId: 'ai-panel-openai' },
        { id: 'toggle-ai-anthropic', targetId: 'ai-panel-anthropic' },
        { id: 'toggle-ai-gemini', targetId: 'ai-panel-gemini' },
        { id: 'toggle-google-calendar', targetId: 'google-calendar-widget' },
        { id: 'toggle-google-tasks', targetId: 'google-tasks-widget' },
        { id: 'toggle-gmail', targetId: 'gmail-widget' },
        { id: 'toggle-github', targetId: 'github-widget' },
        { id: 'toggle-stocks', targetId: 'stocks-widget' },
        { id: 'toggle-github-grass', targetId: 'github-grass-widget' },
        { id: 'toggle-api-diagnostics', targetId: 'api-diagnostics-widget' }
    ];

    toggles.forEach(t => {
        const checkbox = document.getElementById(t.id);
        if (!checkbox) return;

        // 保存済みの表示状態をチェックボックスへ復元する。
        const stored = localStorage.getItem(t.id);
        if (stored !== null) checkbox.checked = stored === 'true';

        /**
         * id指定とclass指定の両方に対応し、単体/複数ウィジェットの表示を切り替える
         */
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

    // 時計の背景（すりガラス）のトグル処理
    const clockGlassCheckbox = document.getElementById('toggle-clock-glass');
    if (clockGlassCheckbox) {
        const storedGlass = localStorage.getItem('toggle-clock-glass');
        if (storedGlass !== null) {
            clockGlassCheckbox.checked = storedGlass === 'true';
        }

        /**
         * 時計のすりガラス背景の表示を切り替える
         */
        const applyClockGlass = () => {
            const isVisible = clockGlassCheckbox.checked;
            document.querySelectorAll('.clock-widget').forEach(el => {
                el.classList.toggle('no-glass-bg', !isVisible);
            });
        };

        applyClockGlass();
        clockGlassCheckbox.addEventListener('change', () => {
            localStorage.setItem('toggle-clock-glass', clockGlassCheckbox.checked);
            applyClockGlass();
        });
    }
}
})();
