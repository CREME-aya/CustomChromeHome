// ==========================================
// initQuickLinks — クイックリンクウィジェット
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initQuickLinks = initQuickLinks;

// 詳細: 関数「initQuickLinks」の処理ブロックを開始する。
function initQuickLinks() {
    // 詳細: 変数「quickLinksContainer」を、この後の処理で使う値として用意する。
    const quickLinksContainer = document.getElementById('quick-links-container');
    // 詳細: 変数「addLinkBtn」を、この後の処理で使う値として用意する。
    const addLinkBtn = document.getElementById('add-link-btn');

    // 詳細: 変数「defaultLinks」を、この後の処理で使う値として用意する。
    const defaultLinks = [
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { title: 'Google', url: 'https://www.google.com' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { title: 'YouTube', url: 'https://www.youtube.com' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { title: 'GitHub', url: 'https://github.com' }
    // 詳細: 配列リテラルの境界を定義する。
    ];

    // 初回起動時はよく使うリンクを保存し、以後はユーザー編集を優先する。
    // 詳細: 変数「quickLinks」を、この後の処理で使う値として用意する。
    let quickLinks = readJsonFromStorage(STORAGE_KEY_LINKS, null);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!quickLinks) {
        // 詳細: 次の処理行「quickLinks = defaultLinks;」の役割を、その場の制御フローに組み込む。
        quickLinks = defaultLinks;
        // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);」の役割を、その場の制御フローに組み込む。
        writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「renderQuickLinks」の処理ブロックを開始する。
    function renderQuickLinks() {
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        quickLinksContainer.innerHTML = '';
        // 詳細: 複数の要素を順番に処理するための反復処理を行う。
        quickLinks.forEach((link, index) => {
            // 詳細: 変数「a」を、この後の処理で使う値として用意する。
            const a = document.createElement('a');
            // 詳細: 次の処理行「a.href = link.url;」の役割を、その場の制御フローに組み込む。
            a.href = link.url;
            // 詳細: 次の処理行「a.className = 'quick-link-item';」の役割を、その場の制御フローに組み込む。
            a.className = 'quick-link-item';

            // アイコンにはGoogleのFavicon APIを利用する。
            // 詳細: 変数「hostname」を、この後の処理で使う値として用意する。
            let hostname = 'localhost';
            // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
            try { hostname = new URL(link.url).hostname; } catch(e){}
            // 詳細: 変数「iconUrl」を、この後の処理で使う値として用意する。
            const iconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

            // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
            a.innerHTML = `
                <img src="${iconUrl}" class="quick-link-icon" alt="icon">
                <span class="quick-link-title">${link.title}</span>
                <button class="delete-link-btn" title="削除">&times;</button>
            `;

            // 詳細: 変数「delBtn」を、この後の処理で使う値として用意する。
            const delBtn = a.querySelector('.delete-link-btn');
            // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
            delBtn.addEventListener('click', (e) => {
                // 詳細: 次の処理行「e.preventDefault();」の役割を、その場の制御フローに組み込む。
                e.preventDefault();
                // 詳細: 次の処理行「e.stopPropagation();」の役割を、その場の制御フローに組み込む。
                e.stopPropagation();
                // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
                if (confirm(`ショートカット「${link.title}」を削除しますか？`)) {
                    // 詳細: 次の処理行「quickLinks.splice(index, 1);」の役割を、その場の制御フローに組み込む。
                    quickLinks.splice(index, 1);
                    // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);」の役割を、その場の制御フローに組み込む。
                    writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
                    // 詳細: 次の処理行「renderQuickLinks();」の役割を、その場の制御フローに組み込む。
                    renderQuickLinks();
                // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
                }
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });

            // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
            quickLinksContainer.appendChild(a);
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    addLinkBtn.addEventListener('click', () => {
        // prompt ベースの簡易追加にして、拡張の設定画面を増やさずに済ませる。
        // 詳細: 変数「url」を、この後の処理で使う値として用意する。
        const url = prompt('追加するサイトのURLを入力してください (例: https://qiita.com):');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!url) return;

        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // 詳細: 次の処理行「new URL(url);」の役割を、その場の制御フローに組み込む。
            new URL(url);
            // 詳細: 変数「title」を、この後の処理で使う値として用意する。
            let title = prompt('サイトのタイトルを入力してください:');
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (!title) title = new URL(url).hostname.replace('www.', '');

            // 詳細: 次の処理行「quickLinks.push({ title, url });」の役割を、その場の制御フローに組み込む。
            quickLinks.push({ title, url });
            // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);」の役割を、その場の制御フローに組み込む。
            writeJsonToStorage(STORAGE_KEY_LINKS, quickLinks);
            // 詳細: 次の処理行「renderQuickLinks();」の役割を、その場の制御フローに組み込む。
            renderQuickLinks();
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (e) {
            // 詳細: 次の処理行「window.showNotification('正しいURLを入力してください。必ず https:// から始めてください。', 'error');」の役割を、その場の制御フローに組み込む。
            window.showNotification('正しいURLを入力してください。必ず https:// から始めてください。', 'error');
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 次の処理行「renderQuickLinks();」の役割を、その場の制御フローに組み込む。
    renderQuickLinks();
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
