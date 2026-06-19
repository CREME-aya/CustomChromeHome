// ==========================================
// initThemeSettings — UIテーマの切り替え
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initThemeSettings = initThemeSettings;

// 詳細: 関数「initThemeSettings」の処理ブロックを開始する。
function initThemeSettings() {
    // 詳細: 変数「themeSelect」を、この後の処理で使う値として用意する。
    const themeSelect = document.getElementById('theme-select');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!themeSelect) return;

    // セレクト表示とHTMLルートのクラスを同じ保存値から復元する。
    // 詳細: 変数「savedTheme」を、この後の処理で使う値として用意する。
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-glass-dark';
    // 詳細: 次の処理行「themeSelect.value = savedTheme;」の役割を、その場の制御フローに組み込む。
    themeSelect.value = savedTheme;

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    themeSelect.addEventListener('change', (e) => {
        // テーマCSSは documentElement のクラスで一括切り替えする。
        // 詳細: 変数「theme」を、この後の処理で使う値として用意する。
        const theme = e.target.value;
        // 詳細: 次の処理行「document.documentElement.className = theme;」の役割を、その場の制御フローに組み込む。
        document.documentElement.className = theme;
        // 詳細: ユーザー設定や状態を localStorage に保存する。
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
