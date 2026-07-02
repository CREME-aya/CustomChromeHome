// ==========================================
// API連携ウィジェット用の共通UIコンポーネント
// ==========================================

/**
 * API連携ウィジェットの各種状態を描画する
 * @param {string} containerId - 描画対象のコンテナID
 * @param {object} options - 描画オプション
 * @param {string} options.className - コンテナに付与するクラス名
 * @param {string} options.message - 表示するメッセージ
 * @param {string} [options.icon=''] - 表示するアイコン
 */
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

/**
 * @constant {object} ApiUI
 * @description API連携ウィジェットのUI状態を管理・操作するユーティリティ群
 */
window.ApiUI = {
    /**
     * ローディング状態を描画する
     * @param {string} containerId - コンテナID
     * @param {string} [message="同期中..."] - 表示メッセージ
     */
    setLoading(containerId, message = "同期中...") {
        renderApiState(containerId, {
            className: 'loading',
            message
        });
    },

    /**
     * エラー状態を描画する
     * @param {string} containerId - コンテナID
     * @param {string} [message="データの取得に失敗しました。"] - エラーメッセージ
     */
    setError(containerId, message = "データの取得に失敗しました。") {
        renderApiState(containerId, {
            className: 'empty-state error-state',
            message,
            icon: '⚠️'
        });
    },

    /**
     * 空データ状態を描画する
     * @param {string} containerId - コンテナID
     * @param {string} [message="データがありません。"] - 表示メッセージ
     */
    setEmpty(containerId, message = "データがありません。") {
        renderApiState(containerId, {
            className: 'empty-state',
            message
        });
    },

    /**
     * 未連携・認証ガイド状態を描画する
     * @param {string} containerId - コンテナID
     * @param {string} [message="未連携です。設定サイドバーから連携してください。"] - ガイドメッセージ
     */
    setAuthGuide(containerId, message = "未連携です。設定サイドバーから連携してください。") {
        renderApiState(containerId, {
            className: 'empty-state auth-guide',
            message
        });
    },

    /**
     * 汎用的なステータスを描画する
     * @param {string} containerId - コンテナID
     * @param {string} message - 表示メッセージ
     * @param {object} [options] - ステータスオプション
     * @param {string} [options.type='info'] - ステータスタイプ
     * @param {string} [options.baseClass='api-status'] - ベースとなるクラス名
     */
    setStatus(containerId, message, { type = 'info', baseClass = 'api-status' } = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.className = `${baseClass} ${type}`.trim();
        container.textContent = String(message);
    }
};
