// ==========================================
// トースト通知
// ==========================================
(function() {
/**
 * デフォルトの通知表示時間 (ミリ秒)
 * @type {number}
 */
const DEFAULT_NOTIFICATION_DURATION_MS = 4000;

window.showNotification = showNotification;

/**
 * トースト通知を表示する
 * @param {string} message - 表示するメッセージ
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - 通知の種類
 * @param {Object} [options={}] - オプション
 * @param {number} [options.durationMs] - 表示時間 (ミリ秒)
 * @returns {HTMLElement} 生成された通知要素
 */
function showNotification(message, type = 'info', options = {}) {
    const container = getNotificationContainer();
    const notification = document.createElement('div');
    // 未定義の種別が渡されてもCSSクラスが壊れないように標準化する。
    const normalizedType = ['info', 'success', 'warning', 'error'].includes(type) ? type : 'info';

    notification.className = `notification ${normalizedType}`;
    notification.textContent = message;
    notification.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');

    container.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add('visible'));

    const duration = options.durationMs ?? DEFAULT_NOTIFICATION_DURATION_MS;
    setTimeout(() => dismissNotification(notification), duration);

    notification.addEventListener('click', () => dismissNotification(notification));
    return notification;
}

/**
 * 通知を表示するためのコンテナ要素を取得または生成する
 * @returns {HTMLElement} コンテナ要素
 */
function getNotificationContainer() {
    let container = document.getElementById('notification-container');
    if (container) return container;

    // HTML側にコンテナがないページでも通知を表示できるように遅延生成する。
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

/**
 * 通知を非表示にしてDOMから削除する
 * @param {HTMLElement} notification - 削除対象の通知要素
 */
function dismissNotification(notification) {
    notification.classList.remove('visible');
    // フェードアウトのCSSトランジション完了後にDOMから取り除く。
    setTimeout(() => notification.remove(), 220);
}
})();
