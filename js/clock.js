// ==========================================
// initClock — 時計ウィジェット
// ==========================================
(function() {
window.initClock = initClock;

function initClock() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');

    function updateClock() {
        // 表示は秒を省略し、ホーム画面で読みやすい分単位にする。
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
