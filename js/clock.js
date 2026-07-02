/**
 * @fileoverview 時計ウィジェット
 */
(function() {
window.initClock = initClock;

/**
 * 時計ウィジェットを初期化する
 */
function initClock() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');

    /**
     * 時計の表示を更新する
     * 表示は秒を省略し、ホーム画面で読みやすい分単位にする。
     */
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;

        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        dateDisplay.textContent = now.toLocaleDateString('ja-JP', options);
    }

    // 分の切り替わりを逃さないよう1秒ごとに再描画する。
    setInterval(updateClock, 1000);
    updateClock();
}
})();
