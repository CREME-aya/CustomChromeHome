// ==========================================
// Google Calendar -> Todo 取り込み
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initCalendarTodoImport = initCalendarTodoImport;

// 詳細: 関数「initCalendarTodoImport」の処理ブロックを開始する。
function initCalendarTodoImport() {
    // 詳細: 変数「urlInput」を、この後の処理で使う値として用意する。
    const urlInput = document.getElementById('calendar-ical-url-input');
    // 詳細: 変数「lookaheadSelect」を、この後の処理で使う値として用意する。
    const lookaheadSelect = document.getElementById('calendar-lookahead-select');
    // 詳細: 変数「saveButton」を、この後の処理で使う値として用意する。
    const saveButton = document.getElementById('calendar-save-btn');
    // 詳細: 変数「syncButton」を、この後の処理で使う値として用意する。
    const syncButton = document.getElementById('calendar-sync-btn');
    // 詳細: 変数「widgetImportButton」を、この後の処理で使う値として用意する。
    const widgetImportButton = document.getElementById('calendar-import-btn');
    // 詳細: 変数「status」を、この後の処理で使う値として用意する。
    const status = document.getElementById('calendar-import-status');

    // 保存済みのiCal URLと取り込み範囲を設定画面へ復元する。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (urlInput) {
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        urlInput.value = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (lookaheadSelect) {
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        lookaheadSelect.value = localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS) || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 次の処理行「updateCalendarImportStatus(status);」の役割を、その場の制御フローに組み込む。
    updateCalendarImportStatus(status);

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    saveButton?.addEventListener('click', () => {
        // 詳細: 次の処理行「saveCalendarImportSettings(」の役割を、その場の制御フローに組み込む。
        saveCalendarImportSettings(
            // 詳細: 次の処理行「urlInput?.value || '',」の役割を、その場の制御フローに組み込む。
            urlInput?.value || '',
            // 詳細: 次の処理行「lookaheadSelect?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS)」の役割を、その場の制御フローに組み込む。
            lookaheadSelect?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS)
        // 詳細: 次の処理行「);」の役割を、その場の制御フローに組み込む。
        );
        // 詳細: 次の処理行「updateCalendarImportStatus(status, '保存しました');」の役割を、その場の制御フローに組み込む。
        updateCalendarImportStatus(status, '保存しました');
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    syncButton?.addEventListener('click', () => importCalendarEventsToTodos(status));

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    widgetImportButton?.addEventListener('click', () => importCalendarEventsToTodos(status));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「saveCalendarImportSettings」の処理ブロックを開始する。
function saveCalendarImportSettings(icalUrl, lookaheadDays) {
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(STORAGE_KEY_CALENDAR_ICAL_URL, icalUrl.trim());
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS, String(parseCalendarLookaheadDays(lookaheadDays)));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「updateCalendarImportStatus」の処理ブロックを開始する。
function updateCalendarImportStatus(status, message) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!status) return;

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (message) {
        // 詳細: 画面に表示するテキストを安全に更新する。
        status.textContent = message;
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「icalUrl」を、この後の処理で使う値として用意する。
    const icalUrl = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    // 詳細: 画面に表示するテキストを安全に更新する。
    status.textContent = icalUrl ? '設定済み' : '未設定';
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「importCalendarEventsToTodos」の処理ブロックを開始する。
async function importCalendarEventsToTodos(status) {
    // 詳細: 変数「icalUrl」を、この後の処理で使う値として用意する。
    const icalUrl = getCalendarIcalUrlFromSettings();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!icalUrl) {
        // 詳細: 次の処理行「updateCalendarImportStatus(status, 'iCal URLを設定してください');」の役割を、その場の制御フローに組み込む。
        updateCalendarImportStatus(status, 'iCal URLを設定してください');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!status) window.showNotification('Googleカレンダーの iCal URLを設定してください。', 'error');
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 次の処理行「updateCalendarImportStatus(status, '予定を取得中...');」の役割を、その場の制御フローに組み込む。
    updateCalendarImportStatus(status, '予定を取得中...');

    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 取得、期間フィルタ、Todo追加を分けて失敗箇所を追いやすくする。
        // 詳細: 変数「events」を、この後の処理で使う値として用意する。
        const events = await fetchGoogleCalendarEvents(icalUrl);
        // 詳細: 変数「importableEvents」を、この後の処理で使う値として用意する。
        const importableEvents = filterImportableCalendarEvents(events);
        // 詳細: 変数「result」を、この後の処理で使う値として用意する。
        const result = addCalendarEventsToTodos(importableEvents);
        // 詳細: 次の処理行「updateCalendarImportStatus(status, バッククォート${result.added}件追加 / ${result.skipped}件スキップバッククォ」の役割を、その場の制御フローに組み込む。
        updateCalendarImportStatus(status, `${result.added}件追加 / ${result.skipped}件スキップ`);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch (e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error(e);
        // 詳細: 次の処理行「updateCalendarImportStatus(status, '予定の取得に失敗しました');」の役割を、その場の制御フローに組み込む。
        updateCalendarImportStatus(status, '予定の取得に失敗しました');
        // 詳細: 次の処理行「window.showNotification('予定の取得に失敗しました。iCal URLを確認してください。', 'error');」の役割を、その場の制御フローに組み込む。
        window.showNotification('予定の取得に失敗しました。iCal URLを確認してください。', 'error');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getCalendarIcalUrlFromSettings」の処理ブロックを開始する。
function getCalendarIcalUrlFromSettings() {
    // 詳細: 変数「input」を、この後の処理で使う値として用意する。
    const input = document.getElementById('calendar-ical-url-input');
    // 詳細: 変数「select」を、この後の処理で使う値として用意する。
    const select = document.getElementById('calendar-lookahead-select');

    // 設定画面で編集途中の値があれば、同期実行前に保存へ反映する。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (input || select) {
        // 詳細: 次の処理行「saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LO」の役割を、その場の制御フローに組み込む。
        saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS));
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「fetchGoogleCalendarEvents」の処理ブロックを開始する。
async function fetchGoogleCalendarEvents(icalUrl) {
    // 詳細: 変数「res」を、この後の処理で使う値として用意する。
    const res = await fetch(icalUrl);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);

    // 詳細: 変数「icsText」を、この後の処理で使う値として用意する。
    const icsText = await res.text();
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return window.parseIcsEvents(icsText);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「filterImportableCalendarEvents」の処理ブロックを開始する。
function filterImportableCalendarEvents(events) {
    // 詳細: 変数「lookaheadDays」を、この後の処理で使う値として用意する。
    const lookaheadDays = parseCalendarLookaheadDays(localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS));
    // 詳細: 変数「rangeStart」を、この後の処理で使う値として用意する。
    const rangeStart = startOfToday();
    // 詳細: 変数「rangeEnd」を、この後の処理で使う値として用意する。
    const rangeEnd = new Date(rangeStart);
    // 詳細: 次の処理行「rangeEnd.setDate(rangeEnd.getDate() + lookaheadDays);」の役割を、その場の制御フローに組み込む。
    rangeEnd.setDate(rangeEnd.getDate() + lookaheadDays);

    // 今日から指定日数以内の予定だけを、Todo化しやすい開始時刻順に絞る。
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return events
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        .filter(event => event.start && event.start >= rangeStart && event.start < rangeEnd)
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        .sort((a, b) => a.start - b.start)
        // 詳細: 次の処理行「.slice(0, MAX_CALENDAR_TODO_IMPORTS);」の役割を、その場の制御フローに組み込む。
        .slice(0, MAX_CALENDAR_TODO_IMPORTS);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「addCalendarEventsToTodos」の処理ブロックを開始する。
function addCalendarEventsToTodos(events) {
    // 詳細: 変数「added」を、この後の処理で使う値として用意する。
    let added = 0;
    // 詳細: 変数「skipped」を、この後の処理で使う値として用意する。
    let skipped = 0;

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    events.forEach(event => {
        // 同じカレンダーイベントを何度同期してもTodoを重複作成しない。
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (hasTodo(todo => todo.source === 'google-calendar' && todo.calendarEventId === event.id)) {
            // 詳細: 次の処理行「skipped += 1;」の役割を、その場の制御フローに組み込む。
            skipped += 1;
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「addTodoItem({」の役割を、その場の制御フローに組み込む。
        addTodoItem({
            // 詳細: オブジェクトのプロパティ値を定義する。
            text: formatCalendarTodoText(event),
            // 詳細: オブジェクトのプロパティ値を定義する。
            completed: false,
            // 詳細: オブジェクトのプロパティ値を定義する。
            source: 'google-calendar',
            // 詳細: オブジェクトのプロパティ値を定義する。
            calendarEventId: event.id,
            // 詳細: 次の処理行「calendarStart: event.start.toISOString()」の役割を、その場の制御フローに組み込む。
            calendarStart: event.start.toISOString()
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
        // 詳細: 次の処理行「added += 1;」の役割を、その場の制御フローに組み込む。
        added += 1;
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (added > 0) {
        // 詳細: 次の処理行「persistAndRenderTodos();」の役割を、その場の制御フローに組み込む。
        persistAndRenderTodos();
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return { added, skipped };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「formatCalendarTodoText」の処理ブロックを開始する。
function formatCalendarTodoText(event) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `${formatCalendarEventStart(event.start, event.isAllDay)} ${event.summary}`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「formatCalendarEventStart」の処理ブロックを開始する。
function formatCalendarEventStart(date, isAllDay) {
    // 詳細: 変数「month」を、この後の処理で使う値として用意する。
    const month = date.getMonth() + 1;
    // 詳細: 変数「day」を、この後の処理で使う値として用意する。
    const day = date.getDate();
    // 詳細: 変数「weekday」を、この後の処理で使う値として用意する。
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (isAllDay) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return `${month}/${day}(${weekday})`;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「hour」を、この後の処理で使う値として用意する。
    const hour = String(date.getHours()).padStart(2, '0');
    // 詳細: 変数「minute」を、この後の処理で使う値として用意する。
    const minute = String(date.getMinutes()).padStart(2, '0');
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `${month}/${day}(${weekday}) ${hour}:${minute}`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseCalendarLookaheadDays」の処理ブロックを開始する。
function parseCalendarLookaheadDays(value) {
    // 詳細: 変数「days」を、この後の処理で使う値として用意する。
    const days = Number.parseInt(value, 10);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (![3, 7, 14, 30].includes(days)) return DEFAULT_CALENDAR_LOOKAHEAD_DAYS;
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return days;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「startOfToday」の処理ブロックを開始する。
function startOfToday() {
    // 詳細: 変数「today」を、この後の処理で使う値として用意する。
    const today = new Date();
    // 詳細: 次の処理行「today.setHours(0, 0, 0, 0);」の役割を、その場の制御フローに組み込む。
    today.setHours(0, 0, 0, 0);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return today;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
