// ==========================================
// iCal パーサーのブラウザ実行テスト
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 関数「runIcalParserTests」の処理ブロックを開始する。
function runIcalParserTests() {
    // 代表的なiCal形式だけを小さく確認し、拡張画面でも実行できるようにする。
    // 詳細: 変数「tests」を、この後の処理で使う値として用意する。
    const tests = [
        // 詳細: 現在のブロック境界を表し、処理範囲を区切る。
        {
            // 詳細: オブジェクトのプロパティ値を定義する。
            name: 'parses timed UTC events',
            // 詳細: 次の処理行「run() {」の役割を、その場の制御フローに組み込む。
            run() {
                // 詳細: 変数「events」を、この後の処理で使う値として用意する。
                const events = parseIcsEvents([
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VCALENDAR',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VEVENT',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'UID:timed-1',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'SUMMARY:Timed Event',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'DTSTART:20260620T010203Z',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'END:VEVENT',
                    // 詳細: 次の処理行「'END:VCALENDAR'」の役割を、その場の制御フローに組み込む。
                    'END:VCALENDAR'
                // 詳細: 配列リテラルの境界を定義する。
                ].join('\r\n'));

                // 詳細: 次の処理行「assertEqual(events.length, 1);」の役割を、その場の制御フローに組み込む。
                assertEqual(events.length, 1);
                // 詳細: 次の処理行「assertEqual(events[0].id, 'timed-1');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].id, 'timed-1');
                // 詳細: 次の処理行「assertEqual(events[0].summary, 'Timed Event');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].summary, 'Timed Event');
                // 詳細: 次の処理行「assertEqual(events[0].start.toISOString(), '2026-06-20T01:02:03.000Z');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.toISOString(), '2026-06-20T01:02:03.000Z');
                // 詳細: 次の処理行「assertEqual(events[0].isAllDay, false);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].isAllDay, false);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 現在のブロック境界を表し、処理範囲を区切る。
        {
            // 詳細: オブジェクトのプロパティ値を定義する。
            name: 'parses all-day events',
            // 詳細: 次の処理行「run() {」の役割を、その場の制御フローに組み込む。
            run() {
                // 詳細: 変数「events」を、この後の処理で使う値として用意する。
                const events = parseIcsEvents([
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VCALENDAR',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VEVENT',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'UID:all-day-1',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'SUMMARY:All\\, Day',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'DTSTART;VALUE=DATE:20260621',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'END:VEVENT',
                    // 詳細: 次の処理行「'END:VCALENDAR'」の役割を、その場の制御フローに組み込む。
                    'END:VCALENDAR'
                // 詳細: 配列リテラルの境界を定義する。
                ].join('\r\n'));

                // 詳細: 次の処理行「assertEqual(events.length, 1);」の役割を、その場の制御フローに組み込む。
                assertEqual(events.length, 1);
                // 詳細: 次の処理行「assertEqual(events[0].id, 'all-day-1');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].id, 'all-day-1');
                // 詳細: 次の処理行「assertEqual(events[0].summary, 'All, Day');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].summary, 'All, Day');
                // 詳細: 次の処理行「assertEqual(events[0].start.getFullYear(), 2026);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.getFullYear(), 2026);
                // 詳細: 次の処理行「assertEqual(events[0].start.getMonth(), 5);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.getMonth(), 5);
                // 詳細: 次の処理行「assertEqual(events[0].start.getDate(), 21);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.getDate(), 21);
                // 詳細: 次の処理行「assertEqual(events[0].isAllDay, true);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].isAllDay, true);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 現在のブロック境界を表し、処理範囲を区切る。
        {
            // 詳細: オブジェクトのプロパティ値を定義する。
            name: 'unfolds continued lines and unescapes text',
            // 詳細: 次の処理行「run() {」の役割を、その場の制御フローに組み込む。
            run() {
                // 詳細: 変数「events」を、この後の処理で使う値として用意する。
                const events = parseIcsEvents([
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VCALENDAR',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VEVENT',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'UID:folded-1',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'SUMMARY:Long',
                    // 詳細: 次の処理行「' folded\\; summary\\nwith break',」の役割を、その場の制御フローに組み込む。
                    ' folded\\; summary\\nwith break',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'DTSTART:20260622T090000',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'END:VEVENT',
                    // 詳細: 次の処理行「'END:VCALENDAR'」の役割を、その場の制御フローに組み込む。
                    'END:VCALENDAR'
                // 詳細: 配列リテラルの境界を定義する。
                ].join('\r\n'));

                // 詳細: 次の処理行「assertEqual(events.length, 1);」の役割を、その場の制御フローに組み込む。
                assertEqual(events.length, 1);
                // 詳細: 次の処理行「assertEqual(events[0].summary, 'Longfolded; summary with break');」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].summary, 'Longfolded; summary with break');
                // 詳細: 次の処理行「assertEqual(events[0].start.getFullYear(), 2026);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.getFullYear(), 2026);
                // 詳細: 次の処理行「assertEqual(events[0].start.getHours(), 9);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].start.getHours(), 9);
                // 詳細: 次の処理行「assertEqual(events[0].isAllDay, false);」の役割を、その場の制御フローに組み込む。
                assertEqual(events[0].isAllDay, false);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 現在のブロック境界を表し、処理範囲を区切る。
        {
            // 詳細: オブジェクトのプロパティ値を定義する。
            name: 'skips events without DTSTART',
            // 詳細: 次の処理行「run() {」の役割を、その場の制御フローに組み込む。
            run() {
                // 詳細: 変数「events」を、この後の処理で使う値として用意する。
                const events = parseIcsEvents([
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VCALENDAR',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'BEGIN:VEVENT',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'UID:no-start',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'SUMMARY:No Start',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'END:VEVENT',
                    // 詳細: 次の処理行「'END:VCALENDAR'」の役割を、その場の制御フローに組み込む。
                    'END:VCALENDAR'
                // 詳細: 配列リテラルの境界を定義する。
                ].join('\r\n'));

                // 詳細: 次の処理行「assertEqual(events.length, 0);」の役割を、その場の制御フローに組み込む。
                assertEqual(events.length, 0);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 配列リテラルの境界を定義する。
    ];

    // 詳細: 変数「results」を、この後の処理で使う値として用意する。
    const results = tests.map((test) => {
        // 失敗したテストだけメッセージを残し、一覧表示で原因を追えるようにする。
        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // 詳細: 次の処理行「test.run();」の役割を、その場の制御フローに組み込む。
            test.run();
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return { name: test.name, passed: true };
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (error) {
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return { name: test.name, passed: false, message: error.message };
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 変数「failed」を、この後の処理で使う値として用意する。
    const failed = results.filter(result => !result.passed);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: オブジェクトのプロパティ値を定義する。
        passed: failed.length === 0,
        // 詳細: オブジェクトのプロパティ値を定義する。
        total: results.length,
        // 詳細: オブジェクトのプロパティ値を定義する。
        failed: failed.length,
        // 詳細: 次の処理行「results」の役割を、その場の制御フローに組み込む。
        results
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「assertEqual」の処理ブロックを開始する。
function assertEqual(actual, expected) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (actual !== expected) {
        // 詳細: 異常状態を呼び出し元へ明示的に伝える。
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseIcsEvents」の処理ブロックを開始する。
function parseIcsEvents(icsText) {
    // ブラウザと単体実行の両方で、公開済みのparseIcsEventsを探す。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (typeof window !== 'undefined' && typeof window.parseIcsEvents === 'function') {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return window.parseIcsEvents(icsText);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (typeof globalThis.parseIcsEvents === 'function') {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return globalThis.parseIcsEvents(icsText);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 異常状態を呼び出し元へ明示的に伝える。
    throw new Error('parseIcsEvents is not available');
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「renderResults」の処理ブロックを開始する。
function renderResults(summary) {
    // HTMLテストページでは、総合結果と各ケースの結果を画面へ描画する。
    // 詳細: 変数「status」を、この後の処理で使う値として用意する。
    const status = document.getElementById('test-status');
    // 詳細: 変数「list」を、この後の処理で使う値として用意する。
    const list = document.getElementById('test-results');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!status || !list) return;

    // 詳細: 画面に表示するテキストを安全に更新する。
    status.textContent = summary.passed
        // 詳細: 次の処理行「? バッククォート${summary.total} tests passedバッククォート」の役割を、その場の制御フローに組み込む。
        ? `${summary.total} tests passed`
        // 詳細: 次の処理行「: バッククォート${summary.failed} of ${summary.total} tests failedバッククォート;」の役割を、その場の制御フローに組み込む。
        : `${summary.failed} of ${summary.total} tests failed`;
    // 詳細: 次の処理行「status.className = summary.passed ? 'passed' : 'failed';」の役割を、その場の制御フローに組み込む。
    status.className = summary.passed ? 'passed' : 'failed';

    // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
    list.innerHTML = '';
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    summary.results.forEach((result) => {
        // 詳細: 変数「item」を、この後の処理で使う値として用意する。
        const item = document.createElement('li');
        // 詳細: 次の処理行「item.className = result.passed ? 'passed' : 'failed';」の役割を、その場の制御フローに組み込む。
        item.className = result.passed ? 'passed' : 'failed';
        // 詳細: 画面に表示するテキストを安全に更新する。
        item.textContent = result.passed ? result.name : `${result.name}: ${result.message}`;
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        list.appendChild(item);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.runIcalParserTests = runIcalParserTests;

// 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
if (typeof document !== 'undefined') {
    // HTMLで開いた場合はロード完了後に自動でテストを走らせる。
    // 詳細: ページ全体のイベントを監視して、初期化や操作処理を開始する。
    document.addEventListener('DOMContentLoaded', () => {
        // 詳細: 次の処理行「renderResults(runIcalParserTests());」の役割を、その場の制御フローに組み込む。
        renderResults(runIcalParserTests());
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
