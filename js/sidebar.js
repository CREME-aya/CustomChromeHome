// ==========================================
// initSidebar — サイドバー開閉ロジック
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initSidebar = initSidebar;

// 詳細: 関数「initSidebar」の処理ブロックを開始する。
function initSidebar() {
    // 詳細: 変数「menuBtn」を、この後の処理で使う値として用意する。
    const menuBtn = document.getElementById('menu-btn');
    // 詳細: 変数「closeSidebarBtn」を、この後の処理で使う値として用意する。
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    // 詳細: 変数「sidebar」を、この後の処理で使う値として用意する。
    const sidebar = document.getElementById('sidebar');
    // 詳細: 変数「sidebarOverlay」を、この後の処理で使う値として用意する。
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!menuBtn || !closeSidebarBtn || !sidebar) return;

    // 詳細: 関数「toggleSidebar」の処理ブロックを開始する。
    function toggleSidebar() {
        // サイドバー本体とオーバーレイを同じタイミングで開閉する。
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        sidebar.classList.toggle('hidden');
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        sidebarOverlay?.classList.toggle('hidden');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    menuBtn.addEventListener('click', toggleSidebar);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    sidebarOverlay?.addEventListener('click', toggleSidebar);

    // 他のinit関数からサイドバーを閉じるために公開
    // 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
    window._toggleSidebar = toggleSidebar;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
