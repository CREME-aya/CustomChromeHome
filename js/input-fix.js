// ==========================================
// initInputFocusFix — Chrome拡張（New Tab）等での入力バグ・フォーカス外れ対策
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initInputFocusFix = initInputFocusFix;

// 詳細: 関数「initInputFocusFix」の処理ブロックを開始する。
function initInputFocusFix() {
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    document.querySelectorAll('input, textarea, select').forEach(el => {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        el.addEventListener('click', (e) => {
            // 新規タブ拡張では入力要素のクリックだけでフォーカスが外れる場合がある。
            // 詳細: 次の処理行「e.target.focus();」の役割を、その場の制御フローに組み込む。
            e.target.focus();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
