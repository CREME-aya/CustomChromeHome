// ==========================================
// initInputFocusFix — Chrome拡張（New Tab）等での入力バグ・フォーカス外れ対策
// ==========================================
(function() {
window.initInputFocusFix = initInputFocusFix;

/**
 * 入力要素のクリック時に明示的にフォーカスを当てる
 * （New Tab拡張などでクリック時にフォーカスが外れるバグの対策）
 */
function initInputFocusFix() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('click', (e) => {
            // 新規タブ拡張では入力要素のクリックだけでフォーカスが外れる場合があるため、明示的にフォーカスを設定
            e.target.focus();
        });
    });
}
})();
