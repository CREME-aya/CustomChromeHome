// ==========================================
// API連携ウィジェット用の共通UIコンポーネント
// ==========================================
function renderApiState(containerId, { className, message, icon = '' }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // API由来のエラー文言をHTMLとして解釈させず、安全なテキストとして描画する。
    const state = document.createElement('div');
    state.className = className;

    if (icon) {
        const iconElement = document.createElement('span');
        iconElement.textContent = icon;
        state.appendChild(iconElement);
    }

    const messageElement = document.createElement('p');
    messageElement.textContent = String(message);
    state.appendChild(messageElement);
    container.replaceChildren(state);
}

window.ApiUI = {
    setLoading(containerId, message = "同期中...") {
        renderApiState(containerId, {
            className: 'loading',
            message
        });
    },
    setError(containerId, message = "データの取得に失敗しました。") {
        renderApiState(containerId, {
            className: 'empty-state error-state',
            message,
            icon: '⚠️'
        });
    },
    setEmpty(containerId, message = "データがありません。") {
        renderApiState(containerId, {
            className: 'empty-state',
            message
        });
    },
    setAuthGuide(containerId, message = "未連携です。設定サイドバーから連携してください。") {
        renderApiState(containerId, {
            className: 'empty-state auth-guide',
            message
        });
    },
    setStatus(containerId, message, { type = 'info', baseClass = 'api-status' } = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.className = `${baseClass} ${type}`.trim();
        container.textContent = String(message);
    }
};
