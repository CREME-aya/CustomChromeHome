// ==========================================
// GitHub Contribution Grass (芝生) ウィジェット処理
// ==========================================
(function() {
let grassPollInterval = null;

window.initGithubGrass = initGithubGrass;

function initGithubGrass() {
    const widget = document.getElementById('github-grass-widget');
    if (!widget) return;

    renderFromCache();

    // 初回フェッチ
    fetchGithubGrass();

    // 1時間ごとに自動更新
    if (grassPollInterval) clearInterval(grassPollInterval);
    grassPollInterval = setInterval(fetchGithubGrass, 60 * 60 * 1000);

    // 同期ボタンのイベント設定
    const syncBtn = document.getElementById('github-grass-sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncBtn.classList.add('rotating');
            fetchGithubGrass().finally(() => {
                setTimeout(() => syncBtn.classList.remove('rotating'), 600);
            });
        });
    }
}

// キャッシュがあれば先にレンダリングする
function renderFromCache() {
    const cached = readJsonFromStorage(STORAGE_KEY_GITHUB_GRASS_CACHE, null);
    if (cached !== null) {
        updateUI(cached);
        return true;
    }
    return false;
}

// GitHub GraphQL API から芝生データを取得
async function fetchGithubGrass() {
    const pat = window.EnvConfig?.getStorageBackedValue(STORAGE_KEY_GITHUB_PAT, 'NEXUS_GITHUB_PAT')
        || localStorage.getItem(STORAGE_KEY_GITHUB_PAT)?.trim()
        || '';
    if (!pat) {
        showGrassError("GitHub PAT が未設定です。設定サイドバーから登録してください。");
        window.ApiDiagnostics?.report('github-grass', 'missing', 'GitHub PAT 未設定');
        return;
    }

    try {
        const query = `
            query {
                viewer {
                    login
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    color
                                    date
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`GitHub GraphQL API error: ${response.status}`);
        }

        const resData = await response.json();
        
        if (resData.errors && resData.errors.length > 0) {
            throw new Error(resData.errors[0].message);
        }

        const calendar = resData.data?.viewer?.contributionsCollection?.contributionCalendar;
        const login = resData.data?.viewer?.login;

        if (!calendar) {
            throw new Error("カレンダーデータの取得に失敗しました。");
        }

        const payload = {
            login,
            totalContributions: calendar.totalContributions,
            weeks: calendar.weeks
        };

        // キャッシュに保存してUIを更新
        writeJsonToStorage(STORAGE_KEY_GITHUB_GRASS_CACHE, payload);
        updateUI(payload);
        window.ApiDiagnostics?.report('github-grass', 'ok', `${payload.totalContributions}件のコントリビューションを取得`);

    } catch (err) {
        console.error("Failed to fetch GitHub grass:", err);
        if (!renderFromCache()) {
            showGrassError("GitHub コントリビューションの取得に失敗しました。PATと通信状態を確認してください。");
            window.ApiDiagnostics?.report('github-grass', 'error', 'GitHub コントリビューション取得に失敗');
        } else {
            window.showNotification?.("GitHub コントリビューションの更新に失敗したため、キャッシュを表示しています。", "warning");
            window.ApiDiagnostics?.report('github-grass', 'warning', 'GitHub コントリビューション更新に失敗。キャッシュを表示');
        }
    }
}

// UIの描画更新
function updateUI(data) {
    const errorEl = document.getElementById('github-grass-error');
    const contentEl = document.getElementById('github-grass-content');
    if (errorEl) errorEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');

    const totalEl = document.getElementById('github-grass-total');
    const containerEl = document.getElementById('github-grass-grid-container');
    const userEl = document.getElementById('github-grass-username');

    if (totalEl) totalEl.textContent = data.totalContributions.toLocaleString();
    if (userEl) userEl.textContent = `@${data.login}`;

    if (!containerEl) return;
    containerEl.innerHTML = '';

    const days = [];
    data.weeks.forEach(w => {
        w.contributionDays.forEach(d => {
            days.push(d);
        });
    });

    days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'grass-cell';
        cell.style.backgroundColor = getAdaptiveColor(day.color);
        
        cell.setAttribute('title', `${day.contributionCount} contributions on ${day.date}`);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `${day.contributionCount} contributions on ${day.date}`);

        containerEl.appendChild(cell);
    });
}

function getAdaptiveColor(color) {
    if (color === '#ebedf0') {
        const isDark = document.body.classList.contains('dark-theme') ||
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDark ? 'rgba(255, 255, 255, 0.05)' : '#ebedf0';
    }
    return color;
}

function showGrassError(msg) {
    const errorEl = document.getElementById('github-grass-error');
    const contentEl = document.getElementById('github-grass-content');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
    }
    if (contentEl) {
        contentEl.classList.add('hidden');
    }
}
})();
