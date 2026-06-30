const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const constantsSource = fs.readFileSync('js/constants.js', 'utf8');
const googleAuthSource = fs.readFileSync('js/google-auth.js', 'utf8');
const baseWidgetSource = fs.readFileSync('js/core/base-widget.js', 'utf8');
const aiConstantsSource = fs.readFileSync('js/ai/constants.js', 'utf8');
const aiSettingsSource = fs.readFileSync('js/ai/settings.js', 'utf8');
const aiProvidersSource = fs.readFileSync('js/ai/providers.js', 'utf8');
const aiWidgetSource = fs.readFileSync('js/ai/widget.js', 'utf8');
const layoutDragSource = fs.readFileSync('js/layout/drag.js', 'utf8');
const layoutWidgetSource = fs.readFileSync('js/layout/widget.js', 'utf8');
const weatherConstantsSource = fs.readFileSync('js/weather/constants.js', 'utf8');
const weatherDataSource = fs.readFileSync('js/weather/data.js', 'utf8');
const weatherWidgetSource = fs.readFileSync('js/weather/widget.js', 'utf8');
const feedConstantsSource = fs.readFileSync('js/feed/constants.js', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');
const ids = new Set([...html.matchAll(/(?:^|\s)id=["']([^"']+)["']/g)].map(match => match[1]));
let failed = 0;

function test(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

test('iCal取り込みに必要な操作要素が存在する', () => {
    [
        'calendar-ical-url-input',
        'calendar-lookahead-select',
        'calendar-save-btn',
        'calendar-sync-btn',
        'calendar-import-status',
        'calendar-import-btn'
    ].forEach(id => assert(ids.has(id), `${id} がありません`));
});

test('株価設定に必要な操作要素が存在する', () => {
    [
        'stock-source-url',
        'save-stock-source-btn',
        'stock-symbol-input',
        'add-stock-btn',
        'stocks-sync-btn'
    ].forEach(id => assert(ids.has(id), `${id} がありません`));
});

test('API診断ウィジェットに必要な操作要素が存在する', () => {
    [
        'toggle-api-diagnostics',
        'api-diagnostics-widget',
        'api-diagnostics-refresh-btn',
        'api-diagnostics-summary',
        'api-diagnostics-list'
    ].forEach(id => assert(ids.has(id), `${id} がありません`));
});

test('予定・タスク統合ビューに必要な操作要素が存在する', () => {
    [
        'toggle-unified-agenda',
        'unified-agenda-widget',
        'unified-agenda-refresh-btn',
        'unified-agenda-summary',
        'unified-agenda-list'
    ].forEach(id => assert(ids.has(id), `${id} がありません`));
});

test('廃止済みGoogle Fitを画面と読み込み対象へ残さない', () => {
    assert(!html.includes('google-fit-widget'), 'Google Fitウィジェットが残っています');
    assert(!html.includes('js/google-fit.js'), 'Google Fitスクリプトが読み込まれています');
});

test('共通API UIを利用モジュールより先に読み込む', () => {
    const apiUiIndex = html.indexOf('js/api-ui.js');
    const baseWidgetIndex = html.indexOf('js/core/base-widget.js');
    const calendarIndex = html.indexOf('js/google-calendar.js');
    assert(apiUiIndex >= 0 && apiUiIndex < calendarIndex, 'api-ui.jsの読み込み順が不正です');
    assert(baseWidgetIndex >= 0 && apiUiIndex < baseWidgetIndex, 'base-widget.js は api-ui.js より後に読み込んでください');
    assert(baseWidgetIndex < calendarIndex, 'base-widget.js の読み込み順が不正です');
});

test('Feed Phase 2 の分割モジュールを正しい順序で読み込む', () => {
    const feedCoreIndex = html.indexOf('js/feed-core.js');
    const feedConstantsIndex = html.indexOf('js/feed/constants.js');
    const feedParserIndex = html.indexOf('js/feed/parser.js');
    const feedDataIndex = html.indexOf('js/feed/data.js');
    const feedSearchIndex = html.indexOf('js/feed/search.js');
    const feedRendererIndex = html.indexOf('js/feed/renderer.js');
    const feedWidgetIndex = html.indexOf('js/feed.js');
    assert(feedCoreIndex >= 0, 'feed-core.js が読み込まれていません');
    assert(feedConstantsIndex > feedCoreIndex, 'feed/constants.js は feed-core.js より後に読み込んでください');
    assert(feedParserIndex > feedConstantsIndex, 'feed/parser.js は feed/constants.js より後に読み込んでください');
    assert(feedDataIndex > feedParserIndex, 'feed/data.js は feed/parser.js より後に読み込んでください');
    assert(feedSearchIndex > feedDataIndex, 'feed/search.js は feed/data.js より後に読み込んでください');
    assert(feedRendererIndex > feedSearchIndex, 'feed/renderer.js は feed/search.js より後に読み込んでください');
    assert(feedWidgetIndex > feedRendererIndex, 'feed.js は feed/renderer.js より後に読み込んでください');
});

test('Feed 定数は feed/constants.js に集約されている', () => {
    assert(feedConstantsSource.includes('window.FeedConstants'), 'FeedConstants が window に公開されていません');
    assert(feedConstantsSource.includes('custom_feed_url'), 'Feed URL 保存キーがありません');
    assert(feedConstantsSource.includes('custom_feed_favorites'), 'Feed favorites 保存キーがありません');
    assert(feedConstantsSource.includes('cacheTtlMs'), 'Feed cache TTL 設定がありません');
    assert(!constantsSource.includes('STORAGE_KEY_FEED_CACHE'), 'constants.js に Feed cache key が残っています');
    assert(!constantsSource.includes('FEED_MAX_ITEMS'), 'constants.js に Feed 描画件数設定が残っています');
});

test('AI Phase 2 の分割モジュールを正しい順序で読み込む', () => {
    const constantsIndex = html.indexOf('js/ai/constants.js');
    const settingsIndex = html.indexOf('js/ai/settings.js');
    const providersIndex = html.indexOf('js/ai/providers.js');
    const widgetIndex = html.indexOf('js/ai/widget.js');
    const facadeIndex = html.indexOf('js/ai.js');
    const appIndex = html.indexOf('js/app.js');
    assert(constantsIndex >= 0, 'ai/constants.js が読み込まれていません');
    assert(settingsIndex > constantsIndex, 'ai/settings.js は ai/constants.js より後に読み込んでください');
    assert(providersIndex > settingsIndex, 'ai/providers.js は ai/settings.js より後に読み込んでください');
    assert(widgetIndex > providersIndex, 'ai/widget.js は ai/providers.js より後に読み込んでください');
    assert(facadeIndex > widgetIndex, 'ai.js は ai/widget.js より後に読み込んでください');
    assert(facadeIndex < appIndex, 'AI facade は app.js より前に読み込んでください');
});

test('AI 定数は ai/constants.js に集約されている', () => {
    assert(aiConstantsSource.includes('window.AiConstants'), 'AiConstants が window に公開されていません');
    assert(aiConstantsSource.includes('custom_openai_api_key'), 'OpenAI API key 保存キーがありません');
    assert(aiConstantsSource.includes('custom_anthropic_api_key'), 'Anthropic API key 保存キーがありません');
    assert(aiConstantsSource.includes('custom_gemini_api_key'), 'Gemini API key 保存キーがありません');
    assert(!constantsSource.includes('STORAGE_KEY_OPENAI_API_KEY'), 'constants.js に OpenAI API key 保存キーが残っています');
    assert(!constantsSource.includes('STORAGE_KEY_ANTHROPIC_API_KEY'), 'constants.js に Anthropic API key 保存キーが残っています');
    assert(!constantsSource.includes('STORAGE_KEY_GEMINI_API_KEY'), 'constants.js に Gemini API key 保存キーが残っています');
});

test('AI Phase 2 の公開契約が分割後も残っている', () => {
    assert(aiSettingsSource.includes('window.AiSettings'), 'AiSettings が window に公開されていません');
    assert(aiSettingsSource.includes('window.initApiKeys'), 'initApiKeys の公開契約がありません');
    assert(aiProvidersSource.includes('window.AiProviders'), 'AiProviders が window に公開されていません');
    assert(aiProvidersSource.includes('fetchOpenAI'), 'OpenAI provider がありません');
    assert(aiProvidersSource.includes('fetchAnthropic'), 'Anthropic provider がありません');
    assert(aiProvidersSource.includes('fetchGemini'), 'Gemini provider がありません');
    assert(aiWidgetSource.includes('window.AiWidget'), 'AiWidget が window に公開されていません');
    assert(aiWidgetSource.includes('window.initMultiAI'), 'initMultiAI の公開契約がありません');
    assert(aiWidgetSource.includes('window.sendToAI'), 'sendToAI の公開契約がありません');
});

test('Layout Phase 2 の分割モジュールを正しい順序で読み込む', () => {
    const defaultsIndex = html.indexOf('js/layout-defaults.js');
    const dragIndex = html.indexOf('js/layout/drag.js');
    const widgetIndex = html.indexOf('js/layout/widget.js');
    const facadeIndex = html.indexOf('js/layout.js');
    const appIndex = html.indexOf('js/app.js');
    assert(defaultsIndex >= 0, 'layout-defaults.js が読み込まれていません');
    assert(dragIndex > defaultsIndex, 'layout/drag.js は layout-defaults.js より後に読み込んでください');
    assert(widgetIndex > dragIndex, 'layout/widget.js は layout/drag.js より後に読み込んでください');
    assert(facadeIndex > widgetIndex, 'layout.js は layout/widget.js より後に読み込んでください');
    assert(facadeIndex < appIndex, 'layout.js は app.js より前に読み込んでください');
});

test('Layout Phase 2 の公開契約が分割後も残っている', () => {
    assert(layoutDragSource.includes('window.LayoutDrag'), 'LayoutDrag が window に公開されていません');
    assert(layoutDragSource.includes('makeElementDraggable'), 'ドラッグ有効化関数がありません');
    assert(layoutDragSource.includes('shouldIgnoreDragStart'), 'ドラッグ開始除外判定がありません');
    assert(layoutWidgetSource.includes('window.LayoutWidget'), 'LayoutWidget が window に公開されていません');
    assert(layoutWidgetSource.includes('window.initWidgetSortable'), 'initWidgetSortable の公開契約がありません');
    assert(layoutWidgetSource.includes('saveWidgetState'), '状態保存関数がありません');
    assert(layoutWidgetSource.includes('restoreWidgetStates'), '状態復元関数がありません');
    assert(layoutWidgetSource.includes('handleWindowResize'), 'リサイズ処理がありません');
});

test('Weather Phase 2 の分割モジュールを正しい順序で読み込む', () => {
    const diagnosticsIndex = html.indexOf('js/api-diagnostics.js');
    const constantsIndex = html.indexOf('js/weather/constants.js');
    const dataIndex = html.indexOf('js/weather/data.js');
    const widgetIndex = html.indexOf('js/weather/widget.js');
    const facadeIndex = html.indexOf('js/weather.js');
    const appIndex = html.indexOf('js/app.js');
    assert(constantsIndex > diagnosticsIndex, 'weather/constants.js は api-diagnostics.js より後に読み込んでください');
    assert(dataIndex > constantsIndex, 'weather/data.js は weather/constants.js より後に読み込んでください');
    assert(widgetIndex > dataIndex, 'weather/widget.js は weather/data.js より後に読み込んでください');
    assert(facadeIndex > widgetIndex, 'weather.js は weather/widget.js より後に読み込んでください');
    assert(facadeIndex < appIndex, 'weather.js は app.js より前に読み込んでください');
});

test('Weather Phase 2 の公開契約が分割後も残っている', () => {
    assert(weatherConstantsSource.includes('window.WeatherConstants'), 'WeatherConstants が window に公開されていません');
    assert(weatherDataSource.includes('window.WeatherData'), 'WeatherData が window に公開されていません');
    assert(weatherDataSource.includes('window.WeatherCore'), 'WeatherCore の互換公開がありません');
    assert(weatherDataSource.includes('fetchWeatherLocationByCity'), '位置検索関数がありません');
    assert(weatherDataSource.includes('buildWeatherForecastUrl'), '予報URL生成関数がありません');
    assert(weatherDataSource.includes('saveWeatherLocation'), '位置保存関数がありません');
    assert(weatherWidgetSource.includes('window.WeatherWidget'), 'WeatherWidget が window に公開されていません');
    assert(weatherWidgetSource.includes('window.initWeatherSettings'), 'initWeatherSettings の公開契約がありません');
    assert(weatherWidgetSource.includes('window.loadWeather'), 'loadWeather の公開契約がありません');
    assert(weatherWidgetSource.includes('renderWeatherWidget'), '天気描画関数がありません');
    assert(weatherWidgetSource.includes('renderWeatherChart'), '天気チャート描画関数がありません');
});

test('API診断と統合ビューをapp.jsより先に読み込む', () => {
    const envConfigIndex = html.indexOf('js/env-config.js');
    const diagnosticsIndex = html.indexOf('js/api-diagnostics.js');
    const agendaIndex = html.indexOf('js/unified-agenda.js');
    const appIndex = html.indexOf('js/app.js');
    assert(envConfigIndex >= 0 && envConfigIndex < diagnosticsIndex, 'env-config.jsの読み込み順が不正です');
    assert(diagnosticsIndex >= 0 && diagnosticsIndex < appIndex, 'api-diagnostics.jsの読み込み順が不正です');
    assert(agendaIndex >= 0 && agendaIndex < appIndex, 'unified-agenda.jsの読み込み順が不正です');
});

test('.env の雛形があり、実ファイルはgitignore対象', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const envExample = fs.readFileSync('.env.example', 'utf8');
    assert(gitignore.includes('.env'), '.env が gitignore にありません');
    assert(gitignore.includes('.env.local'), '.env.local が gitignore にありません');
    assert(envExample.includes('NEXUS_OPENAI_API_KEY'), '.env.example に OpenAI 設定がありません');
    assert(envExample.includes('NEXUS_SPOTIFY_CLIENT_ID'), '.env.example に Spotify 設定がありません');
});

test('YouTube操作に必要な拡張権限を持つ', () => {
    assert(manifest.permissions.includes('tabs'), 'tabs権限がありません');
    assert(manifest.permissions.includes('scripting'), 'scripting権限がありません');
});

test('Google OAuthはスコープ不足を検出できる', () => {
    assert(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(manifest.oauth2?.client_id || ''), 'manifest.json の Google OAuth client_id が不正です');
    assert(!html.includes('<input type="password" id="google-client-id"'), 'Google OAuth Client ID が入力欄に戻っています');
    assert(!googleAuthSource.includes('647744756098-qqksp0oc9cnstcscnvh3abrph3bpsalg.apps.googleusercontent.com'), '古い Google OAuth client_id が JS に残っています');
    assert(googleAuthSource.includes('getManifestGoogleClientId'), 'Google OAuth が manifest の client_id を参照していません');
    assert(googleAuthSource.includes("connectBtn.textContent = hasStoredSession() ? 'Googleと再連携' : 'Googleと連携'"), 'Google再連携ボタンが常時押せる設計になっていません');
    assert(manifest.oauth2?.scopes?.includes('https://www.googleapis.com/auth/calendar'), 'Google Calendar scope が manifest にありません');
    assert(manifest.oauth2?.scopes?.includes('https://www.googleapis.com/auth/tasks'), 'Google Tasks scope が manifest にありません');
    assert(manifest.oauth2?.scopes?.includes('https://www.googleapis.com/auth/gmail.readonly'), 'Gmail readonly scope が manifest にありません');
    assert(googleAuthSource.includes('chrome.identity.getAuthToken'), 'Google OAuth が chrome.identity.getAuthToken を使っていません');
    assert(constantsSource.includes("grantedScopes: 'google_granted_scopes'"), 'Google OAuthの取得済みスコープ保存キーがありません');
    assert(googleAuthSource.includes('getMissingRequiredScopes'), 'Google OAuthのスコープ不足検出がありません');
    assert(googleAuthSource.includes('Google Calendar API'), 'Google API有効化の案内がありません');
    assert(readme.includes('Chrome 拡張機能用クライアント ID'), 'READMEにChrome拡張用OAuthクライアントIDの説明がありません');
});

test('Phase 1 の共通Widget基盤が存在する', () => {
    assert(html.includes('js/core/base-widget.js'), 'BaseWidget が index.html で読み込まれていません');
    assert(baseWidgetSource.includes('class BaseWidget'), 'BaseWidget クラスがありません');
    assert(baseWidgetSource.includes('window.BaseWidget'), 'BaseWidget が window に公開されていません');
    assert(baseWidgetSource.includes('setLoading'), 'BaseWidget に setLoading がありません');
    assert(baseWidgetSource.includes('readCache'), 'BaseWidget に cache 読み込み helper がありません');
});

if (failed > 0) process.exit(1);
