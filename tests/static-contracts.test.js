const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const constantsSource = fs.readFileSync('js/constants.js', 'utf8');
const googleAuthSource = fs.readFileSync('js/google-auth.js', 'utf8');
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

test('株価API設定に必要な操作要素が存在する', () => {
    [
        'stock-api-key',
        'save-stock-api-key-btn',
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
    const calendarIndex = html.indexOf('js/google-calendar.js');
    assert(apiUiIndex >= 0 && apiUiIndex < calendarIndex, 'api-ui.jsの読み込み順が不正です');
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
    assert(manifest.oauth2?.client_id === '760784834651-atgcr5aag36ifmfoh0lghstce1emt7d7.apps.googleusercontent.com', 'manifest.json の Google OAuth client_id が不正です');
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

if (failed > 0) process.exit(1);
