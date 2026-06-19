// ==========================================
// initWidgetToggles — ウィジェット表示トグル
// ==========================================
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

        // Load state
        const stored = localStorage.getItem(t.id);
        if (stored !== null) checkbox.checked = stored === 'true';

        // Apply state function
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

        // Event listener
        checkbox.addEventListener('change', () => {
            localStorage.setItem(t.id, checkbox.checked);
            applyToggle();
        });
    });
}
