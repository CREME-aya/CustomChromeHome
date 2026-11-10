// ==========================================
// API 接続状態・診断ウィジェット
// ==========================================
(function() {
/**
 * 診断ステータスのストレージ保存キー
 * @type {string}
 */
const STATUS_STORAGE_KEY = 'custom_api_diagnostics_statuses_v1';

/**
 * サービス定義の配列
 * @type {Array<Object>}
 */
const SERVICE_DEFINITIONS = [
    { id: 'google-auth', label: 'Google OAuth', kind: 'oauth' },
    { id: 'google-calendar', label: 'Google カレンダー', kind: 'google-api' },
    { id: 'google-tasks', label: 'Google Tasks', kind: 'google-api' },
    { id: 'gmail', label: 'Gmail', kind: 'google-api' },
    { id: 'github', label: 'GitHub', kind: 'storage-key', storageKey: 'STORAGE_KEY_GITHUB_PAT', envName: 'NEXUS_GITHUB_PAT' },
    { id: 'github-grass', label: 'GitHub 芝生', kind: 'storage-key', storageKey: 'STORAGE_KEY_GITHUB_PAT', envName: 'NEXUS_GITHUB_PAT' },
    { id: 'stocks', label: 'GoogleFinance 株価', kind: 'storage-key', storageKey: 'STORAGE_KEY_STOCKS_SOURCE_URL', envName: 'NEXUS_GOOGLEFINANCE_CSV_URL' },
    { id: 'spotify', label: 'Spotify', kind: 'spotify' },
    { id: 'openai', label: 'OpenAI', kind: 'ai-key', provider: 'openai' },
    { id: 'anthropic', label: 'Anthropic', kind: 'ai-key', provider: 'anthropic' },
    { id: 'gemini', label: 'Gemini', kind: 'ai-key', provider: 'gemini' },
    { id: 'feed', label: 'RSS / Discover', kind: 'feed' },
    { id: 'weather', label: 'Open-Meteo 天気', kind: 'weather' }
];

/**
 * 各状態のメタデータ定義
 * @type {Object}
 */
const STATE_META = {
    ok: { label: '正常', rank: 4 },
    warning: { label: '注意', rank: 3 },
    idle: { label: '待機', rank: 2 },
    missing: { label: '未設定', rank: 1 },
    error: { label: '失敗', rank: 0 }
};

/** @type {Object} 現在報告されているステータス情報 */
let reportedStatuses = readReportedStatuses();

window.ApiDiagnostics = {
    init,
    refresh,
    report,
    getStatuses,
    evaluateConfiguredServices
};

/**
 * 診断ウィジェットを初期化する
 */
function init() {
    document.getElementById('api-diagnostics-refresh-btn')
        ?.addEventListener('click', refresh);
    renderDiagnostics();
}

/**
 * 診断表示を再レンダリングする
 */
function refresh() {
    renderDiagnostics();
}

/**
 * 指定されたサービスのステータスを報告して記録する
 * @param {string} serviceId - サービスID
 * @param {'ok'|'warning'|'idle'|'missing'|'error'} state - 現在のステータス
 * @param {string} message - 状態に関するメッセージ
 * @param {Object} [details={}] - 詳細情報
 */
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

/**
 * 設定による評価と実行時の報告をマージしてステータス一覧を取得する
 * @returns {Array<Object>} ステータス一覧
 */
function getStatuses() {
    return mergeRuntimeReports(evaluateConfiguredServices(), reportedStatuses);
}

/**
 * 各サービスの設定状態を評価する
 * @returns {Array<Object>} 各サービスの設定評価結果
 */
function evaluateConfiguredServices() {
    return SERVICE_DEFINITIONS.map((service) => ({
        id: service.id,
        label: service.label,
        ...evaluateService(service)
    }));
}

/**
 * 単一サービスの設定状況を判定する
 * @param {Object} service - 評価対象のサービス定義
 * @returns {Object} 判定結果（state, messageなど）
 */
function evaluateService(service) {
    if (service.kind === 'oauth') return evaluateGoogleAuth();
    if (service.kind === 'google-api') return evaluateGoogleApi();
    if (service.kind === 'spotify') return evaluateSpotify();
    if (service.kind === 'ai-key') return evaluateAiKey(service);
    if (service.kind === 'feed') return evaluateFeed();
    if (service.kind === 'weather') return evaluateWeather();
    return evaluateStorageKey(service);
}

/**
 * Google Auth設定の評価
 * @returns {Object} 評価結果
 */
function evaluateGoogleAuth() {
    const hasClientId = Boolean(window.GoogleAuth?.getConfiguredClientId?.())
        || hasConfiguredValue(getStorageConstant('STORAGE_KEY_GOOGLE_CLIENT_ID'), 'NEXUS_GOOGLE_CLIENT_ID');
    const hasSession = Boolean(window.GoogleAuth?.hasStoredSession?.());
    if (hasSession) return { state: 'ok', message: 'Google セッション保存済み' };
    if (hasClientId) return { state: 'idle', message: 'manifest の Client ID 設定済み。連携待ち' };
    return { state: 'missing', message: 'manifest の Google Client ID 未設定' };
}

/**
 * Google API連携の評価
 * @returns {Object} 評価結果
 */
function evaluateGoogleApi() {
    if (window.GoogleAuth?.hasStoredSession?.()) {
        return { state: 'idle', message: 'Google 連携済み。直近の同期結果を待機' };
    }
    return { state: 'missing', message: 'Google 連携が必要' };
}

/**
 * Spotify連携の評価
 * @returns {Object} 評価結果
 */
function evaluateSpotify() {
    if (window.SpotifyAuth?.hasStoredSession?.()) {
        return { state: 'idle', message: 'Spotify 連携済み。再生状態取得を待機' };
    }
    return { state: 'missing', message: 'Spotify 未連携' };
}

/**
 * AI APIキー設定の評価
 * @param {Object} service - AIサービス定義
 * @returns {Object} 評価結果
 */
function evaluateAiKey(service) {
    const config = window.AiConstants?.apiKeys?.[service.provider];
    return hasConfiguredValue(config?.storageKey, config?.envName)
        ? { state: 'idle', message: '設定値保存済み。直近の通信結果を待機' }
        : { state: 'missing', message: '設定値未設定' };
}

/**
 * フィード設定の評価
 * @returns {Object} 評価結果
 */
function evaluateFeed() {
    const urls = typeof window.getStoredFeedUrls === 'function'
        ? window.getStoredFeedUrls()
        : [];
    return urls.length > 0
        ? { state: 'idle', message: `${urls.length}件のフィード設定あり` }
        : { state: 'missing', message: 'フィードURL未設定' };
}

/**
 * 天気設定の評価
 * @returns {Object} 評価結果
 */
function evaluateWeather() {
    return { state: 'idle', message: '保存済み地点で取得待ち' };
}

/**
 * ストレージキー依存のサービス評価
 * @param {Object} service - ストレージキー依存のサービス定義
 * @returns {Object} 評価結果
 */
function evaluateStorageKey(service) {
    const storageKey = getStorageConstant(service.storageKey);
    return hasConfiguredValue(storageKey, service.envName)
        ? { state: 'idle', message: '設定値保存済み。直近の通信結果を待機' }
        : { state: 'missing', message: '設定値未設定' };
}

/**
 * 基本のステータス情報に、実行時に報告されたステータス情報をマージする
 * @param {Array<Object>} baseStatuses - 初期または設定評価からのステータス配列
 * @param {Object} reports - ランタイム報告されたステータスマップ
 * @returns {Array<Object>} マージされたステータス配列
 */
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

/**
 * 診断ステータス一覧をDOMにレンダリングする
 */
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

/**
 * 個別のステータス要素を生成する
 * @param {Object} status - ステータス情報
 * @returns {HTMLElement} 生成されたDOM要素
 */
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

/**
 * ローカルストレージから報告済みステータスを読み取る
 * @returns {Object} キャッシュされたステータスマップ
 */
function readReportedStatuses() {
    try {
        return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
    } catch (error) {
        console.warn('API診断キャッシュを読み取れませんでした。', error);
        return {};
    }
}

/**
 * 報告済みステータスをローカルストレージに書き込む
 * @param {Object} statuses - 保存するステータスマップ
 */
function writeReportedStatuses(statuses) {
    try {
        writeJsonToStorage(STATUS_STORAGE_KEY, statuses);
    } catch (error) {
        console.warn('API診断キャッシュを保存できませんでした。', error);
    }
}

/**
 * グローバルなストレージ関連定数を安全に取得する
 * @param {string} name - 取得する定数名
 * @returns {string} 定数値（未定義の場合は空文字列）
 */
function getStorageConstant(name) {
    try {
        const storageConstants = {
            STORAGE_KEY_GOOGLE_CLIENT_ID: typeof STORAGE_KEY_GOOGLE_CLIENT_ID !== 'undefined' ? STORAGE_KEY_GOOGLE_CLIENT_ID : '',
            STORAGE_KEY_GITHUB_PAT: typeof STORAGE_KEY_GITHUB_PAT !== 'undefined' ? STORAGE_KEY_GITHUB_PAT : '',
            STORAGE_KEY_STOCKS_SOURCE_URL: typeof STORAGE_KEY_STOCKS_SOURCE_URL !== 'undefined' ? STORAGE_KEY_STOCKS_SOURCE_URL : ''
        };
        return storageConstants[name] || '';
    } catch (error) {
        return '';
    }
}

/**
 * 設定値（ストレージまたは環境変数相当）が存在するか判定する
 * @param {string} key - ローカルストレージのキー
 * @param {string} envName - 環境変数名
 * @returns {boolean} 値が設定されていればtrue
 */
function hasConfiguredValue(key, envName) {
    return Boolean(
        window.EnvConfig?.hasStorageBackedValue(key, envName)
        || (key && localStorage.getItem(key)?.trim())
    );
}

/**
 * タイムスタンプをフォーマットする
 * @param {number} timestamp - 時刻のミリ秒
 * @returns {string} フォーマットされた時刻文字列
 */
function formatCheckedAt(timestamp) {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
})();
