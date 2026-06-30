const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
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
    const diagnosticsIndex = html.indexOf('js/api-diagnostics.js');
    const agendaIndex = html.indexOf('js/unified-agenda.js');
    const appIndex = html.indexOf('js/app.js');
    assert(diagnosticsIndex >= 0 && diagnosticsIndex < appIndex, 'api-diagnostics.jsの読み込み順が不正です');
    assert(agendaIndex >= 0 && agendaIndex < appIndex, 'unified-agenda.jsの読み込み順が不正です');
});

test('YouTube操作に必要な拡張権限を持つ', () => {
    assert(manifest.permissions.includes('tabs'), 'tabs権限がありません');
    assert(manifest.permissions.includes('scripting'), 'scripting権限がありません');
});

if (failed > 0) process.exit(1);
