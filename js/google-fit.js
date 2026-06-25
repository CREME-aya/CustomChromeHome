// ==========================================
// Google Fit (万歩計) ウィジェット処理
// ==========================================
(function() {
const DEFAULT_STEP_GOAL = 8000;
let fitPollInterval = null;

window.initGoogleFit = initGoogleFit;

function initGoogleFit() {
    const widget = document.getElementById('google-fit-widget');
    if (!widget) return;

    setupStepGoal();
    renderFromCache();

    // 初回フェッチ
    fetchFitSteps();

    // 15分ごとに自動更新
    if (fitPollInterval) clearInterval(fitPollInterval);
    fitPollInterval = setInterval(fetchFitSteps, 15 * 60 * 1000);

    // 同期ボタンのイベント設定
    const syncBtn = document.getElementById('google-fit-sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncBtn.classList.add('rotating');
            fetchFitSteps().finally(() => {
                setTimeout(() => syncBtn.classList.remove('rotating'), 600);
            });
        });
    }
}

// 目標歩数の設定を初期化・読み込み
function setupStepGoal() {
    const goalInput = document.getElementById('google-fit-goal-input');
    if (!goalInput) return;

    const storedGoal = localStorage.getItem(STORAGE_KEY_GOOGLE_FIT_STEP_GOAL);
    goalInput.value = storedGoal ? parseInt(storedGoal, 10) : DEFAULT_STEP_GOAL;

    goalInput.addEventListener('change', () => {
        let val = parseInt(goalInput.value, 10);
        if (isNaN(val) || val <= 0) val = DEFAULT_STEP_GOAL;
        localStorage.setItem(STORAGE_KEY_GOOGLE_FIT_STEP_GOAL, val);
        goalInput.value = val;
        // キャッシュデータを元に再描画し、新しい目標値をすぐに反映させる
        const cached = readJsonFromStorage(STORAGE_KEY_GOOGLE_FIT_CACHE, null);
        if (cached !== null) {
            updateUI(cached, val);
        }
    });
}

// キャッシュがあれば先にレンダリングする (Stale-While-Revalidate パターン)
function renderFromCache() {
    const cached = readJsonFromStorage(STORAGE_KEY_GOOGLE_FIT_CACHE, null);
    const goal = getStepGoal();
    if (cached !== null) {
        updateUI(cached, goal);
    } else {
        updateUI(0, goal);
    }
}

function getStepGoal() {
    const stored = localStorage.getItem(STORAGE_KEY_GOOGLE_FIT_STEP_GOAL);
    return stored ? parseInt(stored, 10) : DEFAULT_STEP_GOAL;
}

// Google Fit API から今日の歩数を取得
async function fetchFitSteps() {
    if (!window.GoogleAuth || !window.GoogleAuth.hasStoredSession()) {
        showFitError("Google アカウントが未連携です。");
        return;
    }

    try {
        const token = await window.GoogleAuth.getValidAccessToken();
        if (!token) {
            showFitError("認証トークンの取得に失敗しました。");
            return;
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aggregateBy: [{
                    dataTypeName: 'com.google.step_count.delta',
                    dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                }],
                bucketByTime: { durationMillis: 86400000 },
                // Google Fit APIはタイムスタンプを文字列形式で要求するため、Stringにキャストして送信する
                startTimeMillis: String(startOfDay.getTime()),
                endTimeMillis: String(endOfDay.getTime())
            })
        });

        if (!response.ok) {
            throw new Error(`Fit API error: ${response.status}`);
        }

        const data = await response.json();
        let totalSteps = 0;

        if (data.bucket && data.bucket.length > 0) {
            data.bucket.forEach(b => {
                if (b.dataset && b.dataset.length > 0) {
                    b.dataset.forEach(ds => {
                        if (ds.point && ds.point.length > 0) {
                            ds.point.forEach(p => {
                                if (p.value && p.value.length > 0) {
                                    p.value.forEach(v => {
                                        if (v.intVal) {
                                            totalSteps += v.intVal;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        // キャッシュに保存してUIを更新
        writeJsonToStorage(STORAGE_KEY_GOOGLE_FIT_CACHE, totalSteps);
        updateUI(totalSteps, getStepGoal());

    } catch (err) {
        console.error("Failed to fetch Google Fit steps:", err);
        const cached = readJsonFromStorage(STORAGE_KEY_GOOGLE_FIT_CACHE, null);
        if (cached !== null) {
            renderFromCache();
            window.showNotification("Google Fit の歩数同期に失敗しました。キャッシュを表示しています。", "warning");
        } else {
            showFitError(`歩数の取得に失敗しました。(${err.message})`);
        }
    }
}

// UIの描画更新
function updateUI(steps, goal) {
    const errorEl = document.getElementById('google-fit-error');
    const contentEl = document.getElementById('google-fit-content');
    if (errorEl) errorEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');

    const stepsValEl = document.getElementById('google-fit-steps-value');
    const goalValEl = document.getElementById('google-fit-goal-value');
    const progressTextEl = document.getElementById('google-fit-progress-text');
    const circleEl = document.getElementById('google-fit-progress-circle');

    if (stepsValEl) stepsValEl.textContent = steps.toLocaleString();
    if (goalValEl) goalValEl.textContent = goal.toLocaleString();

    const percent = Math.min(100, Math.max(0, (steps / goal) * 100));
    
    if (progressTextEl) {
        if (steps >= goal) {
            progressTextEl.textContent = "目標達成！素晴らしい！🎉";
            progressTextEl.style.color = "#55c500";
        } else {
            const diff = goal - steps;
            progressTextEl.textContent = `目標達成まで あと ${diff.toLocaleString()} 歩`;
            progressTextEl.style.color = "var(--text-muted)";
        }
    }

    if (circleEl) {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        circleEl.style.strokeDasharray = `${circumference} ${circumference}`;
        circleEl.style.strokeDashoffset = offset;
    }
}

function showFitError(msg) {
    const errorEl = document.getElementById('google-fit-error');
    const contentEl = document.getElementById('google-fit-content');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
    }
    if (contentEl) {
        contentEl.classList.add('hidden');
    }
}
})();
