// ==========================================
// initClock — 時計ウィジェット
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initClock = initClock;

// 詳細: 関数「initClock」の処理ブロックを開始する。
function initClock() {
    // 詳細: 変数「timeDisplay」を、この後の処理で使う値として用意する。
    const timeDisplay = document.getElementById('time-display');
    // 詳細: 変数「dateDisplay」を、この後の処理で使う値として用意する。
    const dateDisplay = document.getElementById('date-display');

    // 詳細: 関数「updateClock」の処理ブロックを開始する。
    function updateClock() {
        // 表示は秒を省略し、ホーム画面で読みやすい分単位にする。
        // 詳細: 変数「now」を、この後の処理で使う値として用意する。
        const now = new Date();
        // 詳細: 変数「hours」を、この後の処理で使う値として用意する。
        const hours = String(now.getHours()).padStart(2, '0');
        // 詳細: 変数「minutes」を、この後の処理で使う値として用意する。
        const minutes = String(now.getMinutes()).padStart(2, '0');
        // 詳細: 画面に表示するテキストを安全に更新する。
        timeDisplay.textContent = `${hours}:${minutes}`;

        // 詳細: 変数「options」を、この後の処理で使う値として用意する。
        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        // 詳細: 画面に表示するテキストを安全に更新する。
        dateDisplay.textContent = now.toLocaleDateString('ja-JP', options);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 分の切り替わりを逃さないよう1秒ごとに再描画する。
    // 詳細: 指定間隔で同じ処理を繰り返し実行する。
    setInterval(updateClock, 1000);
    // 詳細: 次の処理行「updateClock();」の役割を、その場の制御フローに組み込む。
    updateClock();
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
