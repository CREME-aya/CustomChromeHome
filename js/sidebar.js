// ==========================================
// initSidebar — サイドバー開閉ロジック
// ==========================================
function initSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (!menuBtn || !closeSidebarBtn || !sidebar) return;

    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        sidebarOverlay?.classList.toggle('hidden');
    }

    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay?.addEventListener('click', toggleSidebar);

    // 他のinit関数からサイドバーを閉じるために公開
    window._toggleSidebar = toggleSidebar;
}
