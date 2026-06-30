// ==========================================
// Gmail 簡易未読メールウィジェット
// ==========================================
(function() {
const GoogleAuth = window.GoogleAuth;
let currentEmails = [];

window.Gmail = {
    init,
    loadEmails
};

if (typeof document !== 'undefined') {
    document.addEventListener('google:connected', () => loadEmails());
    document.addEventListener('google:disconnected', () => loadEmails());
}

function init() {
    const syncBtn = document.getElementById('gmail-sync-btn');
    syncBtn?.addEventListener('click', () => loadEmails(true));

    const cached = localStorage.getItem(STORAGE_KEY_GMAIL_CACHE);
    if (cached) {
        try {
            currentEmails = JSON.parse(cached);
            renderEmails();
        } catch(e) {
            console.warn("Gmail cache parse failed", e);
        }
    }

    if (GoogleAuth.hasStoredSession()) {
        loadEmails();
    } else {
        renderUnauthenticated();
    }
}

async function loadEmails(force = false) {
    if (!GoogleAuth.hasStoredSession()) {
        renderUnauthenticated();
        window.ApiDiagnostics?.report('gmail', 'missing', 'Google 連携が必要');
        return;
    }

    setLoading(true);

    try {
        const token = await GoogleAuth.getValidAccessToken();
        if (!token) {
            setLoading(false);
            renderUnauthenticated();
            return;
        }

        const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!listRes.ok) {
            throw await GoogleAuth.createApiError(listRes, 'Gmail');
        }

        const listData = await listRes.json();
        const messages = listData.messages || [];

        if (messages.length === 0) {
            currentEmails = [];
            localStorage.setItem(STORAGE_KEY_GMAIL_CACHE, JSON.stringify(currentEmails));
            renderEmails();
            window.ApiDiagnostics?.report('gmail', 'ok', '未読メールはありません');
            return;
        }

        const emailDetails = [];
        for (const msg of messages) {
            try {
                const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!detailRes.ok) {
                    throw await GoogleAuth.createApiError(detailRes, 'Gmail');
                }

                const detail = await detailRes.json();
                emailDetails.push(parseEmailData(detail));
            } catch(err) {
                console.warn(`Failed to fetch email details for id: ${msg.id}`, err);
                if (err.status === 401 || err.status === 403) {
                    throw err;
                }
            }
        }

        currentEmails = emailDetails;
        localStorage.setItem(STORAGE_KEY_GMAIL_CACHE, JSON.stringify(currentEmails));
        renderEmails();
        window.ApiDiagnostics?.report('gmail', 'ok', `${currentEmails.length}件の未読メールを取得`);
    } catch(e) {
        console.error("Gmail load emails failed", e);
        setLoading(false);
        if (currentEmails.length > 0) {
            window.showNotification("Gmailの同期に失敗しました。キャッシュを表示しています。", "warning");
            window.ApiDiagnostics?.report('gmail', 'warning', 'Gmail同期に失敗。キャッシュを表示');
        } else {
            renderError(e.message || "メールの同期に失敗しました。");
            window.ApiDiagnostics?.report('gmail', 'error', e.message || 'メールの同期に失敗');
        }
    }
}

function parseEmailData(message) {
    const headers = message.payload?.headers || [];
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');

    let from = fromHeader ? fromHeader.value : '不明な送信元';
    const nameMatch = from.match(/^([^<]+)/);
    if (nameMatch) {
        from = nameMatch[1].trim().replace(/^"|"$/g, '');
    }

    const date = dateHeader ? new Date(dateHeader.value) : new Date();

    return {
        id: message.id,
        threadId: message.threadId,
        subject: subjectHeader ? subjectHeader.value : '(無題)',
        from: from,
        date: date.toISOString(),
        snippet: message.snippet || ''
    };
}

function renderEmails() {
    const list = document.getElementById('gmail-list');
    if (!list) return;

    list.innerHTML = '';
    setLoading(false);

    if (currentEmails.length === 0) {
        list.innerHTML = '<div class="empty-state">未読メールはありません。</div>';
        return;
    }

    currentEmails.forEach(email => {
        const item = document.createElement('div');
        item.className = 'gmail-item';

        const meta = document.createElement('div');
        meta.className = 'gmail-item-meta';

        const from = document.createElement('span');
        from.className = 'gmail-item-from';
        from.textContent = email.from;

        const time = document.createElement('span');
        time.className = 'gmail-item-time';
        time.textContent = formatEmailTime(email.date);

        meta.append(from, time);

        const link = document.createElement('a');
        link.className = 'gmail-item-subject';
        link.href = `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = email.subject;

        const snippet = document.createElement('div');
        snippet.className = 'gmail-item-snippet';
        snippet.textContent = email.snippet;

        item.append(meta, link, snippet);
        list.appendChild(item);
    });
}

function renderUnauthenticated() {
    window.ApiUI.setAuthGuide('gmail-list', 'Google アカウントと未連携です。設定サイドバーの Google 連携設定を行ってください。');
    window.ApiDiagnostics?.report('gmail', 'missing', 'Google 連携が必要');
}

function renderError(message) {
    window.ApiUI.setError('gmail-list', message);
}

function setLoading(isLoading) {
    if (isLoading) {
        window.ApiUI.setLoading('gmail-list', 'Gmail から同期中...');
    }
}

function formatEmailTime(dateIso) {
    const d = new Date(dateIso);
    const now = new Date();
    
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}
})();
