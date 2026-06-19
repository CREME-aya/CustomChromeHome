// ==========================================
// iCal パーサーのブラウザ実行テスト
// ==========================================
(function() {
function runIcalParserTests() {
    // 代表的なiCal形式だけを小さく確認し、拡張画面でも実行できるようにする。
    const tests = [
        {
            name: 'parses timed UTC events',
            run() {
                const events = parseIcsEvents([
                    'BEGIN:VCALENDAR',
                    'BEGIN:VEVENT',
                    'UID:timed-1',
                    'SUMMARY:Timed Event',
                    'DTSTART:20260620T010203Z',
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\r\n'));

                assertEqual(events.length, 1);
                assertEqual(events[0].id, 'timed-1');
                assertEqual(events[0].summary, 'Timed Event');
                assertEqual(events[0].start.toISOString(), '2026-06-20T01:02:03.000Z');
                assertEqual(events[0].isAllDay, false);
            }
        },
        {
            name: 'parses all-day events',
            run() {
                const events = parseIcsEvents([
                    'BEGIN:VCALENDAR',
                    'BEGIN:VEVENT',
                    'UID:all-day-1',
                    'SUMMARY:All\\, Day',
                    'DTSTART;VALUE=DATE:20260621',
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\r\n'));

                assertEqual(events.length, 1);
                assertEqual(events[0].id, 'all-day-1');
                assertEqual(events[0].summary, 'All, Day');
                assertEqual(events[0].start.getFullYear(), 2026);
                assertEqual(events[0].start.getMonth(), 5);
                assertEqual(events[0].start.getDate(), 21);
                assertEqual(events[0].isAllDay, true);
            }
        },
        {
            name: 'unfolds continued lines and unescapes text',
            run() {
                const events = parseIcsEvents([
                    'BEGIN:VCALENDAR',
                    'BEGIN:VEVENT',
                    'UID:folded-1',
                    'SUMMARY:Long',
                    ' folded\\; summary\\nwith break',
                    'DTSTART:20260622T090000',
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\r\n'));

                assertEqual(events.length, 1);
                assertEqual(events[0].summary, 'Longfolded; summary with break');
                assertEqual(events[0].start.getFullYear(), 2026);
                assertEqual(events[0].start.getHours(), 9);
                assertEqual(events[0].isAllDay, false);
            }
        },
        {
            name: 'skips events without DTSTART',
            run() {
                const events = parseIcsEvents([
                    'BEGIN:VCALENDAR',
                    'BEGIN:VEVENT',
                    'UID:no-start',
                    'SUMMARY:No Start',
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\r\n'));

                assertEqual(events.length, 0);
            }
        }
    ];

    const results = tests.map((test) => {
        // 失敗したテストだけメッセージを残し、一覧表示で原因を追えるようにする。
        try {
            test.run();
            return { name: test.name, passed: true };
        } catch (error) {
            return { name: test.name, passed: false, message: error.message };
        }
    });

    const failed = results.filter(result => !result.passed);
    return {
        passed: failed.length === 0,
        total: results.length,
        failed: failed.length,
        results
    };
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function parseIcsEvents(icsText) {
    // ブラウザと単体実行の両方で、公開済みのparseIcsEventsを探す。
    if (typeof window !== 'undefined' && typeof window.parseIcsEvents === 'function') {
        return window.parseIcsEvents(icsText);
    }
    if (typeof globalThis.parseIcsEvents === 'function') {
        return globalThis.parseIcsEvents(icsText);
    }
    throw new Error('parseIcsEvents is not available');
}

function renderResults(summary) {
    // HTMLテストページでは、総合結果と各ケースの結果を画面へ描画する。
    const status = document.getElementById('test-status');
    const list = document.getElementById('test-results');
    if (!status || !list) return;

    status.textContent = summary.passed
        ? `${summary.total} tests passed`
        : `${summary.failed} of ${summary.total} tests failed`;
    status.className = summary.passed ? 'passed' : 'failed';

    list.innerHTML = '';
    summary.results.forEach((result) => {
        const item = document.createElement('li');
        item.className = result.passed ? 'passed' : 'failed';
        item.textContent = result.passed ? result.name : `${result.name}: ${result.message}`;
        list.appendChild(item);
    });
}

window.runIcalParserTests = runIcalParserTests;

if (typeof document !== 'undefined') {
    // HTMLで開いた場合はロード完了後に自動でテストを走らせる。
    document.addEventListener('DOMContentLoaded', () => {
        renderResults(runIcalParserTests());
    });
}
})();
