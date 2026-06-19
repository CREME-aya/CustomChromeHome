// ==========================================
// トースト通知
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 変数「DEFAULT_NOTIFICATION_DURATION_MS」を、この後の処理で使う値として用意する。
const DEFAULT_NOTIFICATION_DURATION_MS = 4000;

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.showNotification = showNotification;

// 詳細: 関数「showNotification」の処理ブロックを開始する。
function showNotification(message, type = 'info', options = {}) {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    const container = getNotificationContainer();
    // 詳細: 変数「notification」を、この後の処理で使う値として用意する。
    const notification = document.createElement('div');
    // 未定義の種別が渡されてもCSSクラスが壊れないように標準化する。
    // 詳細: 変数「normalizedType」を、この後の処理で使う値として用意する。
    const normalizedType = ['info', 'success', 'error'].includes(type) ? type : 'info';

    // 詳細: 次の処理行「notification.className = バッククォートnotification ${normalizedType}バッククォート;」の役割を、その場の制御フローに組み込む。
    notification.className = `notification ${normalizedType}`;
    // 詳細: 画面に表示するテキストを安全に更新する。
    notification.textContent = message;
    // 詳細: 次の処理行「notification.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');」の役割を、その場の制御フローに組み込む。
    notification.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');

    // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
    container.appendChild(notification);
    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
    requestAnimationFrame(() => notification.classList.add('visible'));

    // 詳細: 変数「duration」を、この後の処理で使う値として用意する。
    const duration = options.durationMs ?? DEFAULT_NOTIFICATION_DURATION_MS;
    // 詳細: 指定時間だけ待ってから、後続の処理を実行する。
    setTimeout(() => dismissNotification(notification), duration);

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    notification.addEventListener('click', () => dismissNotification(notification));
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return notification;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getNotificationContainer」の処理ブロックを開始する。
function getNotificationContainer() {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    let container = document.getElementById('notification-container');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (container) return container;

    // HTML側にコンテナがないページでも通知を表示できるように遅延生成する。
    // 詳細: 新しいDOM要素を作成し、画面へ組み込めるようにする。
    container = document.createElement('div');
    // 詳細: 次の処理行「container.id = 'notification-container';」の役割を、その場の制御フローに組み込む。
    container.id = 'notification-container';
    // 詳細: 次の処理行「container.className = 'notification-container';」の役割を、その場の制御フローに組み込む。
    container.className = 'notification-container';
    // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
    document.body.appendChild(container);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return container;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「dismissNotification」の処理ブロックを開始する。
function dismissNotification(notification) {
    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
    notification.classList.remove('visible');
    // フェードアウトのCSSトランジション完了後にDOMから取り除く。
    // 詳細: 不要になったDOM要素を画面から取り除く。
    setTimeout(() => notification.remove(), 220);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
