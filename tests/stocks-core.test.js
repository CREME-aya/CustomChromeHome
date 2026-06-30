const fs = require('fs');
const vm = require('vm');

global.window = globalThis;
vm.runInThisContext(fs.readFileSync('js/stocks.js', 'utf8'));

const parseGoogleFinanceCsv = window.StocksWidget.parseGoogleFinanceCsv;
const normalizeGoogleFinanceCsvUrl = window.StocksWidget.normalizeGoogleFinanceCsvUrl;
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

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('GoogleFinance CSVを株価表示用データへ変換する', () => {
    const [result] = parseGoogleFinanceCsv([
        'symbol,name,price,change,changepct,currency,updatedAt,prices',
        'NASDAQ:AAPL,Apple,210.00,10.00,5.00,USD,2026/06/25 16:00,"190;200;210"'
    ].join('\n'));

    assertEqual(result.symbol, 'NASDAQ:AAPL');
    assertEqual(result.name, 'Apple');
    assertEqual(result.price, 210);
    assertEqual(result.change, 10);
    assertEqual(result.changePercent, 5);
    assertEqual(result.currency, 'USD');
    assertEqual(result.updatedAt, '2026/06/25 16:00');
    assertEqual(result.prices.length, 3);
});

test('日本語ヘッダーとカンマ入り数値を扱う', () => {
    const [result] = parseGoogleFinanceCsv([
        '銘柄,株価,前日比,騰落率,通貨',
        'TYO:7203,"3,250",-12.5,-0.38,JPY'
    ].join('\n'));

    assertEqual(result.symbol, 'TYO:7203');
    assertEqual(result.price, 3250);
    assertEqual(result.change, -12.5);
    assertEqual(result.changePercent, -0.38);
    assertEqual(result.currency, 'JPY');
});

test('Google Sheets編集URLをCSV URLへ正規化する', () => {
    const result = normalizeGoogleFinanceCsvUrl('https://docs.google.com/spreadsheets/d/sheet-id/edit#gid=123');
    assertEqual(result, 'https://docs.google.com/spreadsheets/d/sheet-id/gviz/tq?tqx=out%3Acsv&gid=123');
});

test('必須列がないCSVを拒否する', () => {
    let thrown = false;
    try {
        parseGoogleFinanceCsv('name,price\nApple,210');
    } catch (error) {
        thrown = true;
    }
    assertEqual(thrown, true);
});

if (failed > 0) process.exit(1);
