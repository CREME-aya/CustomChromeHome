// 定数の定義
const DEFAULT_URL = 'https://qiita.com/popular-items/feed';
const STORAGE_KEY = 'custom_feed_url';

// DOM読み込み完了時に初期化処理を行う
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('feed-url-input');
    const saveBtn = document.getElementById('save-url-btn');
    
    // 保存されたURLを読み込む（なければデフォルトのQiita）
    const savedUrl = localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
    urlInput.value = savedUrl;

    // 初回フィード読み込み
    loadFeed(savedUrl);

    // 保存ボタンのクリックイベント
    saveBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            localStorage.setItem(STORAGE_KEY, url);
            loadFeed(url);
        }
    });
});

/**
 * 指定されたURLからRSS/Atomフィードを取得し、画面に描画する
 * @param {string} url - 取得するフィードのURL
 */
async function loadFeed(url) {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<div class="loading">記事を読み込み中...</div>';

    try {
        // Chromeの新しいタブ等のコンテキストではCORS制約が厳しいため、パブリックプロキシを経由して取得する
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        
        // パースエラーのチェック
        if (xml.querySelector('parsererror')) {
            throw new Error('XMLの解析に失敗しました。URLが正しいRSS/Atomフィードか確認してください。');
        }

        // Atom (entry) と RSS 2.0 (item) の両方に対応
        const entries = xml.querySelectorAll('entry, item');
        
        container.innerHTML = '';
        
        if (entries.length === 0) {
            container.innerHTML = '<div class="loading">記事が見つかりませんでした。</div>';
            return;
        }

        // DOMの頻繁な更新を防ぐためにDocumentFragmentを使用
        const fragment = document.createDocumentFragment();

        entries.forEach((entry) => {
            const titleNode = entry.querySelector('title');
            const title = titleNode ? titleNode.textContent : 'No Title';
            
            // リンクの取得 (Atom: <link href="...">, RSS: <link>...</link>)
            const linkNode = entry.querySelector('link');
            let itemUrl = '#';
            if (linkNode) {
                itemUrl = linkNode.getAttribute('href') || linkNode.textContent;
            }

            const div = document.createElement('div');
            div.className = 'item';
            
            const aTag = document.createElement('a');
            aTag.className = 'link';
            aTag.href = itemUrl;
            aTag.textContent = title;
            aTag.target = '_blank';
            aTag.rel = 'noopener noreferrer'; // セキュリティ向上

            div.appendChild(aTag);
            fragment.appendChild(div);
        });  

        // 組み立てたDOMを一括で追加
        container.appendChild(fragment);

    } catch(err) {
        console.error(err);
        container.innerHTML = `<div class="error-msg">フィードの取得に失敗しました。<br><small>${err.message}</small></div>`;
    }
}