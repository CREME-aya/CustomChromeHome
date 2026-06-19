// ==========================================
// initInputFocusFix — Chrome拡張（New Tab）等での入力バグ・フォーカス外れ対策
// ==========================================
(function() {
window.initInputFocusFix = initInputFocusFix;

function initInputFocusFix() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('click', (e) => {
            e.target.focus();
        });
    });
}
})();
