// ==========================================
// トースト通知
// ==========================================
(function() {
const DEFAULT_NOTIFICATION_DURATION_MS = 4000;

window.showNotification = showNotification;

function showNotification(message, type = 'info', options = {}) {
    const container = getNotificationContainer();
    const notification = document.createElement('div');
    // 未定義の種別が渡されてもCSSクラスが壊れないように標準化する。
    const normalizedType = ['info', 'success', 'error'].includes(type) ? type : 'info';

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

function dismissNotification(notification) {
    notification.classList.remove('visible');
    // フェードアウトのCSSトランジション完了後にDOMから取り除く。
    setTimeout(() => notification.remove(), 220);
}
})();
