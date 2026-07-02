// ==========================================
// initQuickLinks — クイックリンクウィジェット
// ==========================================
(function() {
window.initQuickLinks = initQuickLinks;

/**
 * クイックリンクウィジェットを初期化する
 */
function initQuickLinks() {
    const quickLinksContainer = document.getElementById('quick-links-container');
    const addLinkBtn = document.getElementById('add-link-btn');

    /**
     * @constant {Array<{title: string, url: string}>}
     * @description デフォルトのクイックリンク一覧
     */
    const defaultLinks = [
        { title: 'Google', url: 'https://www.google.com' },
        { title: 'YouTube', url: 'https://www.youtube.com' },
        { title: 'GitHub', url: 'https://github.com' }
    ];

    // 初回起動時はよく使うリンクを保存し、以後はユーザー編集を優先する。
    let quickLinks = readJsonFromStorage(STORAGE_KEY_LINKS, null);
    if (!quickLinks) {
        quickLinks = defaultLinks;
        writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
    }

    /**
     * クイックリンクをDOMに描画する
     */
    function renderQuickLinks() {
        quickLinksContainer.innerHTML = '';
        quickLinks.forEach((link, index) => {
            const safeUrl = normalizeQuickLinkUrl(link.url);
            if (!safeUrl) return;

            const a = document.createElement('a');
            a.href = safeUrl;
            a.className = 'quick-link-item';

            // アイコンにはGoogleのFavicon APIを利用する。
            let hostname = 'localhost';
            try { hostname = new URL(safeUrl).hostname; } catch(e){}
            const iconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

            // 保存データをHTML文字列へ埋め込まず、DOM APIで安全に描画する。
            const icon = document.createElement('img');
            icon.src = iconUrl;
            icon.className = 'quick-link-icon';
            icon.alt = '';

            const title = document.createElement('span');
            title.className = 'quick-link-title';
            title.textContent = String(link.title || hostname);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-link-btn';
            delBtn.type = 'button';
            delBtn.title = '削除';
            delBtn.textContent = '×';
            a.append(icon, title, delBtn);
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
        // prompt ベースの簡易追加にして、拡張の設定画面を増やさずに済ませる。
        const url = prompt('追加するサイトのURLを入力してください (例: https://qiita.com):');
        if (!url) return;

        try {
            const normalizedUrl = normalizeQuickLinkUrl(url);
            if (!normalizedUrl) throw new Error('Unsupported URL');
            let title = prompt('サイトのタイトルを入力してください:');
            if (!title) title = new URL(normalizedUrl).hostname.replace('www.', '');

            quickLinks.push({ title, url: normalizedUrl });
            writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
            renderQuickLinks();
        } catch (e) {
            window.showNotification('正しいURLを入力してください。必ず https:// から始めてください。', 'error');
        }
    });

    renderQuickLinks();
}

/**
 * ブラウザで安全に開けるHTTP(S) URLだけをクイックリンクとして受け付ける。
 * @param {string} value - 正規化対象のURL文字列
 * @returns {string} - 正規化されたURL、無効な場合は空文字
 */
function normalizeQuickLinkUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (error) {
        return '';
    }
}
})();
