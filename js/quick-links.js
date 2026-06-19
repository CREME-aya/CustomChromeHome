// ==========================================
// initQuickLinks — クイックリンクウィジェット
// ==========================================
(function() {
window.initQuickLinks = initQuickLinks;

function initQuickLinks() {
    const quickLinksContainer = document.getElementById('quick-links-container');
    const addLinkBtn = document.getElementById('add-link-btn');

    const defaultLinks = [
        { title: 'Google', url: 'https://www.google.com' },
        { title: 'YouTube', url: 'https://www.youtube.com' },
        { title: 'GitHub', url: 'https://github.com' }
    ];

    let quickLinks = readJsonFromStorage(STORAGE_KEY_LINKS, null);
    if (!quickLinks) {
        quickLinks = defaultLinks;
        writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
    }

    function renderQuickLinks() {
        quickLinksContainer.innerHTML = '';
        quickLinks.forEach((link, index) => {
            const a = document.createElement('a');
            a.href = link.url;
            a.className = 'quick-link-item';

            // アイコンにはGoogleのFavicon APIを利用
            let hostname = 'localhost';
            try { hostname = new URL(link.url).hostname; } catch(e){}
            const iconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

            a.innerHTML = `
                <img src="${iconUrl}" class="quick-link-icon" alt="icon">
                <span class="quick-link-title">${link.title}</span>
                <button class="delete-link-btn" title="削除">&times;</button>
            `;

            const delBtn = a.querySelector('.delete-link-btn');
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`ショートカット「${link.title}」を削除しますか？`)) {
                    quickLinks.splice(index, 1);
                    writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
                    renderQuickLinks();
                }
            });

            quickLinksContainer.appendChild(a);
        });
    }

    addLinkBtn.addEventListener('click', () => {
        const url = prompt('追加するサイトのURLを入力してください (例: https://qiita.com):');
        if (!url) return;

        try {
            new URL(url);
            let title = prompt('サイトのタイトルを入力してください:');
            if (!title) title = new URL(url).hostname.replace('www.', '');

            quickLinks.push({ title, url });
            writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
            renderQuickLinks();
        } catch (e) {
            window.showNotification('正しいURLを入力してください。必ず https:// から始めてください。', 'error');
        }
    });

    renderQuickLinks();
}
})();
