const fs = require('fs');
const vm = require('vm');

global.window = globalThis;
vm.runInThisContext(fs.readFileSync('js/stocks.js', 'utf8'));

const parseDailySeries = window.StocksWidget.parseDailySeries;
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

test('Alpha Vantageの日足を最新価格と騰落率へ変換する', () => {
    const result = parseDailySeries('AAPL', {
        'Meta Data': { '2. Symbol': 'AAPL' },
        'Time Series (Daily)': {
            '2026-06-24': { '4. close': '200.00' },
            '2026-06-25': { '4. close': '210.00' }
        }
    });

    assertEqual(result.symbol, 'AAPL');
    assertEqual(result.price, 210);
    assertEqual(result.change, 10);
    assertEqual(result.changePercent, 5);
    assertEqual(result.updatedAt, '2026-06-25');
});

test('APIの利用上限メッセージをエラーとして扱う', () => {
    let thrown = false;
    try {
        parseDailySeries('AAPL', { Note: 'rate limit' });
    } catch (error) {
        thrown = error.message === 'rate limit';
    }
    assertEqual(thrown, true);
});

test('終値がないレスポンスを拒否する', () => {
    let thrown = false;
    try {
        parseDailySeries('AAPL', { 'Time Series (Daily)': {} });
    } catch (error) {
        thrown = true;
    }
    assertEqual(thrown, true);
});

if (failed > 0) process.exit(1);
