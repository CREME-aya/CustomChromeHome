// ==========================================
// GitHub 連携ウィジェット
// ==========================================
(function() {
let currentIssues = [];

window.GitHub = {
    init,
    initSettings,
    loadIssues
};

function init() {
    const syncBtn = document.getElementById('github-sync-btn');
    syncBtn?.addEventListener('click', () => loadIssues(true));

    initSettings();

    const cached = localStorage.getItem(STORAGE_KEY_GITHUB_CACHE);
    if (cached) {
        try {
            currentIssues = JSON.parse(cached);
            renderIssues();
        } catch(e) {
            console.warn("GitHub cache parse failed", e);
        }
    }

    const pat = localStorage.getItem(STORAGE_KEY_GITHUB_PAT);
    if (pat) {
        loadIssues();
    } else {
        renderUnauthenticated();
    }
}

async function loadIssues(force = false) {
    const pat = localStorage.getItem(STORAGE_KEY_GITHUB_PAT);
    if (!pat) {
        renderUnauthenticated();
        window.ApiDiagnostics?.report('github', 'missing', 'GitHub PAT 未設定');
        return;
    }

    setLoading(true);

    try {
        const url = 'https://api.github.com/search/issues?q=assignee:@me+state:open&per_page=10';
        const res = await fetch(url, {
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (res.status === 401) {
            throw new Error("Unauthorized");
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = data.items || [];

        currentIssues = items.map(item => {
            const isPR = Boolean(item.pull_request);
            const repoMatch = item.html_url.match(/github\.com\/([^/]+\/[^/]+)/);
            const repoName = repoMatch ? repoMatch[1] : 'unknown';

            return {
                id: item.id,
                title: item.title,
                number: item.number,
                url: item.html_url,
                isPR: isPR,
                repoName: repoName,
                user: item.user?.login || 'unknown',
                updatedAt: item.updated_at
            };
        });

        localStorage.setItem(STORAGE_KEY_GITHUB_CACHE, JSON.stringify(currentIssues));
        renderIssues();
        window.ApiDiagnostics?.report('github', 'ok', `${currentIssues.length}件のIssue/PRを取得`);
    } catch(e) {
        console.error("GitHub load issues failed", e);
        setLoading(false);
        if (currentIssues.length > 0) {
            window.showNotification("GitHubの同期に失敗しました。キャッシュを表示しています。", "warning");
            window.ApiDiagnostics?.report('github', 'warning', 'GitHub同期に失敗。キャッシュを表示');
        } else {
            renderError("GitHubデータの同期に失敗しました。");
            window.ApiDiagnostics?.report('github', 'error', 'GitHubデータの同期に失敗');
        }
    }
}

function renderIssues() {
    const list = document.getElementById('github-list');
    if (!list) return;

    list.innerHTML = '';
    setLoading(false);

    if (currentIssues.length === 0) {
        list.innerHTML = '<div class="empty-state">アサインされたIssue・PRはありません。</div>';
        return;
    }

    currentIssues.forEach(issue => {
        const item = document.createElement('div');
        item.className = 'github-item';

        const meta = document.createElement('div');
        meta.className = 'github-item-meta';

        const repo = document.createElement('span');
        repo.className = 'github-item-repo';
        repo.textContent = issue.repoName;

        const number = document.createElement('span');
        number.className = 'github-item-number';
        number.textContent = `#${issue.number}`;

        meta.append(repo, number);

        const typeBadge = document.createElement('span');
        typeBadge.className = `github-item-badge ${issue.isPR ? 'pr' : 'issue'}`;
        typeBadge.textContent = issue.isPR ? 'PR' : 'Issue';

        const link = document.createElement('a');
        link.className = 'github-item-title';
        link.href = issue.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = issue.title;

        const content = document.createElement('div');
        content.className = 'github-item-content';
        content.append(typeBadge, link);

        item.append(meta, content);
        list.appendChild(item);
    });
}

function renderUnauthenticated() {
    window.ApiUI.setAuthGuide('github-list', 'GitHub PAT が設定されていません。設定サイドバーの GitHub 連携設定を行ってください。');
}

function renderError(message) {
    window.ApiUI.setError('github-list', message);
}

function setLoading(isLoading) {
    if (isLoading) {
        window.ApiUI.setLoading('github-list', 'GitHub から同期中...');
    }
}
function initSettings() {
    const patInput = document.getElementById('github-pat');
    const saveBtn = document.getElementById('save-github-btn');

    if (patInput) {
        patInput.value = localStorage.getItem(STORAGE_KEY_GITHUB_PAT) || '';
    }

    saveBtn?.addEventListener('click', () => {
        if (!patInput) return;
        const val = patInput.value.trim();
        if (val) {
            localStorage.setItem(STORAGE_KEY_GITHUB_PAT, val);
            window.showNotification("GitHub 設定を保存しました。", "success");
            loadIssues();
        } else {
            localStorage.removeItem(STORAGE_KEY_GITHUB_PAT);
            window.showNotification("GitHub 設定を解除しました。", "success");
            renderUnauthenticated();
            window.ApiDiagnostics?.report('github', 'missing', 'GitHub PAT 未設定');
        }
        window.ApiDiagnostics?.refresh?.();
    });
}
})();
