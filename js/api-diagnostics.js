// ==========================================
// API 接続状態・診断ウィジェット
// ==========================================
(function() {
const STATUS_STORAGE_KEY = 'custom_api_diagnostics_statuses_v1';

const SERVICE_DEFINITIONS = [
    { id: 'google-auth', label: 'Google OAuth', kind: 'oauth' },
    { id: 'google-calendar', label: 'Google カレンダー', kind: 'google-api' },
    { id: 'google-tasks', label: 'Google Tasks', kind: 'google-api' },
    { id: 'gmail', label: 'Gmail', kind: 'google-api' },
    { id: 'github', label: 'GitHub', kind: 'storage-key', storageKey: 'STORAGE_KEY_GITHUB_PAT', envName: 'NEXUS_GITHUB_PAT' },
    { id: 'github-grass', label: 'GitHub 芝生', kind: 'storage-key', storageKey: 'STORAGE_KEY_GITHUB_PAT', envName: 'NEXUS_GITHUB_PAT' },
    { id: 'stocks', label: 'Alpha Vantage 株価', kind: 'storage-key', storageKey: 'STORAGE_KEY_STOCKS_API_KEY', envName: 'NEXUS_ALPHA_VANTAGE_API_KEY' },
    { id: 'spotify', label: 'Spotify', kind: 'spotify' },
    { id: 'openai', label: 'OpenAI', kind: 'storage-key', storageKey: 'STORAGE_KEY_OPENAI_API_KEY', envName: 'NEXUS_OPENAI_API_KEY' },
    { id: 'anthropic', label: 'Anthropic', kind: 'storage-key', storageKey: 'STORAGE_KEY_ANTHROPIC_API_KEY', envName: 'NEXUS_ANTHROPIC_API_KEY' },
    { id: 'gemini', label: 'Gemini', kind: 'storage-key', storageKey: 'STORAGE_KEY_GEMINI_API_KEY', envName: 'NEXUS_GEMINI_API_KEY' },
    { id: 'feed', label: 'RSS / Discover', kind: 'feed' },
    { id: 'weather', label: 'Open-Meteo 天気', kind: 'weather' }
];

const STATE_META = {
    ok: { label: '正常', rank: 4 },
    warning: { label: '注意', rank: 3 },
    idle: { label: '待機', rank: 2 },
    missing: { label: '未設定', rank: 1 },
    error: { label: '失敗', rank: 0 }
};

let reportedStatuses = readReportedStatuses();

window.ApiDiagnostics = {
    init,
    refresh,
    report,
    getStatuses,
    evaluateConfiguredServices
};

function init() {
    document.getElementById('api-diagnostics-refresh-btn')
        ?.addEventListener('click', refresh);
    renderDiagnostics();
}

function refresh() {
    renderDiagnostics();
}

function report(serviceId, state, message, details = {}) {
    if (!STATE_META[state]) return;

    reportedStatuses[serviceId] = {
        state,
        message: String(message || ''),
        details,
        checkedAt: Date.now()
    };
    writeReportedStatuses(reportedStatuses);
    renderDiagnostics();
}

function getStatuses() {
    return mergeRuntimeReports(evaluateConfiguredServices(), reportedStatuses);
}

function evaluateConfiguredServices() {
    return SERVICE_DEFINITIONS.map((service) => ({
        id: service.id,
        label: service.label,
        ...evaluateService(service)
    }));
}

function evaluateService(service) {
    if (service.kind === 'oauth') return evaluateGoogleAuth();
    if (service.kind === 'google-api') return evaluateGoogleApi();
    if (service.kind === 'spotify') return evaluateSpotify();
    if (service.kind === 'feed') return evaluateFeed();
    if (service.kind === 'weather') return evaluateWeather();
    return evaluateStorageKey(service);
}

function evaluateGoogleAuth() {
    const hasClientId = Boolean(window.GoogleAuth?.getConfiguredClientId?.())
        || hasConfiguredValue(getStorageConstant('STORAGE_KEY_GOOGLE_CLIENT_ID'), 'NEXUS_GOOGLE_CLIENT_ID');
    const hasSession = Boolean(window.GoogleAuth?.hasStoredSession?.());
    if (hasSession) return { state: 'ok', message: 'Google セッション保存済み' };
    if (hasClientId) return { state: 'idle', message: 'manifest の Client ID 設定済み。連携待ち' };
    return { state: 'missing', message: 'manifest の Google Client ID 未設定' };
}

function evaluateGoogleApi() {
    if (window.GoogleAuth?.hasStoredSession?.()) {
        return { state: 'idle', message: 'Google 連携済み。直近の同期結果を待機' };
    }
    return { state: 'missing', message: 'Google 連携が必要' };
}

function evaluateSpotify() {
    if (window.SpotifyAuth?.hasStoredSession?.()) {
        return { state: 'idle', message: 'Spotify 連携済み。再生状態取得を待機' };
    }
    return { state: 'missing', message: 'Spotify 未連携' };
}

function evaluateFeed() {
    const urls = typeof window.getStoredFeedUrls === 'function'
        ? window.getStoredFeedUrls()
        : [];
    return urls.length > 0
        ? { state: 'idle', message: `${urls.length}件のフィード設定あり` }
        : { state: 'missing', message: 'フィードURL未設定' };
}

function evaluateWeather() {
    return { state: 'idle', message: '保存済み地点で取得待ち' };
}

function evaluateStorageKey(service) {
    const storageKey = getStorageConstant(service.storageKey);
    return hasConfiguredValue(storageKey, service.envName)
        ? { state: 'idle', message: '認証情報設定済み。直近の通信結果を待機' }
        : { state: 'missing', message: '認証情報未設定' };
}

function mergeRuntimeReports(baseStatuses, reports) {
    return baseStatuses.map((baseStatus) => {
        const reportStatus = reports[baseStatus.id];
        if (!reportStatus) return baseStatus;
        if (baseStatus.state === 'missing' && reportStatus.state !== 'missing') return baseStatus;
        if (baseStatus.state !== 'missing' && reportStatus.state === 'missing') return baseStatus;

        return {
            ...baseStatus,
            state: reportStatus.state,
            message: reportStatus.message || baseStatus.message,
            checkedAt: reportStatus.checkedAt
        };
    });
}

function renderDiagnostics() {
    const list = document.getElementById('api-diagnostics-list');
    const summary = document.getElementById('api-diagnostics-summary');
    if (!list) return;

    const statuses = getStatuses();
    list.replaceChildren();
    statuses.forEach(status => list.appendChild(createStatusRow(status)));

    if (summary) {
        const okCount = statuses.filter(status => status.state === 'ok').length;
        const problemCount = statuses.filter(status => ['error', 'missing'].includes(status.state)).length;
        summary.textContent = `正常 ${okCount} / 要確認 ${problemCount}`;
    }
}

function createStatusRow(status) {
    const item = document.createElement('div');
    item.className = `api-diagnostics-item state-${status.state}`;

    const body = document.createElement('div');
    body.className = 'api-diagnostics-body';

    const title = document.createElement('div');
    title.className = 'api-diagnostics-title';
    title.textContent = status.label;

    const message = document.createElement('div');
    message.className = 'api-diagnostics-message';
    message.textContent = status.checkedAt
        ? `${status.message} / ${formatCheckedAt(status.checkedAt)}`
        : status.message;

    const badge = document.createElement('span');
    badge.className = 'api-diagnostics-badge';
    badge.textContent = STATE_META[status.state]?.label || status.state;

    body.append(title, message);
    item.append(body, badge);
    return item;
}

function readReportedStatuses() {
    try {
        return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
    } catch (error) {
        console.warn('API診断キャッシュを読み取れませんでした。', error);
        return {};
    }
}

function writeReportedStatuses(statuses) {
    try {
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statuses));
    } catch (error) {
        console.warn('API診断キャッシュを保存できませんでした。', error);
    }
}

function getStorageConstant(name) {
    try {
        const storageConstants = {
            STORAGE_KEY_GOOGLE_CLIENT_ID: typeof STORAGE_KEY_GOOGLE_CLIENT_ID !== 'undefined' ? STORAGE_KEY_GOOGLE_CLIENT_ID : '',
            STORAGE_KEY_GITHUB_PAT: typeof STORAGE_KEY_GITHUB_PAT !== 'undefined' ? STORAGE_KEY_GITHUB_PAT : '',
            STORAGE_KEY_STOCKS_API_KEY: typeof STORAGE_KEY_STOCKS_API_KEY !== 'undefined' ? STORAGE_KEY_STOCKS_API_KEY : '',
            STORAGE_KEY_OPENAI_API_KEY: typeof STORAGE_KEY_OPENAI_API_KEY !== 'undefined' ? STORAGE_KEY_OPENAI_API_KEY : '',
            STORAGE_KEY_ANTHROPIC_API_KEY: typeof STORAGE_KEY_ANTHROPIC_API_KEY !== 'undefined' ? STORAGE_KEY_ANTHROPIC_API_KEY : '',
            STORAGE_KEY_GEMINI_API_KEY: typeof STORAGE_KEY_GEMINI_API_KEY !== 'undefined' ? STORAGE_KEY_GEMINI_API_KEY : ''
        };
        return storageConstants[name] || '';
    } catch (error) {
        return '';
    }
}

function hasConfiguredValue(key, envName) {
    return Boolean(
        window.EnvConfig?.hasStorageBackedValue(key, envName)
        || (key && localStorage.getItem(key)?.trim())
    );
}

function formatCheckedAt(timestamp) {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
})();
