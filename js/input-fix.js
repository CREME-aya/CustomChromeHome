// ==========================================
// initInputFocusFix — Chrome拡張（New Tab）等での入力バグ・フォーカス外れ対策
// ==========================================
(function() {
window.initInputFocusFix = initInputFocusFix;

function initInputFocusFix() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('click', (e) => {
            // 新規タブ拡張では入力要素のクリックだけでフォーカスが外れる場合がある。
            e.target.focus();
        });
    });
}
})();
