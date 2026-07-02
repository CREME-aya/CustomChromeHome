// ==========================================
// Google Calendar -> Todo 取り込み
// ==========================================
(function() {
window.initCalendarTodoImport = initCalendarTodoImport;

/**
 * カレンダーからTodoへの取り込み機能を初期化する
 */
function initCalendarTodoImport() {
    const urlInput = document.getElementById('calendar-ical-url-input');
    const lookaheadSelect = document.getElementById('calendar-lookahead-select');
    const saveButton = document.getElementById('calendar-save-btn');
    const syncButton = document.getElementById('calendar-sync-btn');
    const widgetImportButton = document.getElementById('calendar-import-btn');
    const status = document.getElementById('calendar-import-status');

    // 保存済みのiCal URLと取り込み範囲を設定画面へ復元する。
    if (urlInput) {
        urlInput.value = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    }
    if (lookaheadSelect) {
        lookaheadSelect.value = localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS) || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS);
    }
    updateCalendarImportStatus(status);

    saveButton?.addEventListener('click', () => {
        saveCalendarImportSettings(
            urlInput?.value || '',
            lookaheadSelect?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS)
        );
        updateCalendarImportStatus(status, '保存しました');
    });

    syncButton?.addEventListener('click', () => importCalendarEventsToTodos(status));

    widgetImportButton?.addEventListener('click', () => importCalendarEventsToTodos(status));
}

/**
 * カレンダーの取り込み設定を保存する
 * @param {string} icalUrl - iCalのURL
 * @param {string|number} lookaheadDays - 取り込み対象とする先の日数
 */
function saveCalendarImportSettings(icalUrl, lookaheadDays) {
    localStorage.setItem(STORAGE_KEY_CALENDAR_ICAL_URL, icalUrl.trim());
    localStorage.setItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS, String(parseCalendarLookaheadDays(lookaheadDays)));
}

/**
 * 取り込みステータスの表示を更新する
 * @param {HTMLElement} status - ステータスを表示する要素
 * @param {string} [message] - 表示するメッセージ（省略時は設定状態に応じたメッセージ）
 */
function updateCalendarImportStatus(status, message) {
    if (!status) return;

    if (message) {
        status.textContent = message;
        return;
    }

    const icalUrl = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    status.textContent = icalUrl ? '設定済み' : '未設定';
}

/**
 * カレンダーのイベントを取得してTodoに追加する
 * @param {HTMLElement} status - ステータスを表示する要素
 */
async function importCalendarEventsToTodos(status) {
    const icalUrl = getCalendarIcalUrlFromSettings();
    if (!icalUrl) {
        updateCalendarImportStatus(status, 'iCal URLを設定してください');
        if (!status) window.showNotification('Googleカレンダーの iCal URLを設定してください。', 'error');
        return;
    }

    updateCalendarImportStatus(status, '予定を取得中...');

    try {
        // 取得、期間フィルタ、Todo追加を分けて失敗箇所を追いやすくする。
        const events = await fetchGoogleCalendarEvents(icalUrl);
        const importableEvents = filterImportableCalendarEvents(events);
        const result = addCalendarEventsToTodos(importableEvents);
        updateCalendarImportStatus(status, `${result.added}件追加 / ${result.skipped}件スキップ`);
    } catch (e) {
        console.error(e);
        updateCalendarImportStatus(status, '予定の取得に失敗しました');
        window.showNotification('予定の取得に失敗しました。iCal URLを確認してください。', 'error');
    }
}

/**
 * 設定からiCal URLを取得する（入力中の値がある場合は保存する）
 * @returns {string} iCal URL
 */
function getCalendarIcalUrlFromSettings() {
    const input = document.getElementById('calendar-ical-url-input');
    const select = document.getElementById('calendar-lookahead-select');

    // 設定画面で編集途中の値があれば、同期実行前に保存へ反映する。
    if (input || select) {
        saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS));
    }

    return localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
}

/**
 * Googleカレンダーのイベントを取得・パースする
 * @param {string} icalUrl - 取得対象のiCal URL
 * @returns {Promise<Array>} イベントオブジェクトの配列
 */
async function fetchGoogleCalendarEvents(icalUrl) {
    const res = await fetch(icalUrl);
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);

    const icsText = await res.text();
    return window.parseIcsEvents(icsText);
}

/**
 * 取り込み対象となるイベントを絞り込む
 * @param {Array} events - パースされたイベントの配列
 * @returns {Array} フィルタ・ソート済みのイベント配列
 */
function filterImportableCalendarEvents(events) {
    const lookaheadDays = parseCalendarLookaheadDays(localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS));
    const rangeStart = startOfToday();
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + lookaheadDays);

    // 今日から指定日数以内の予定だけを、Todo化しやすい開始時刻順に絞る。
    return events
        .filter(event => event.start && event.start >= rangeStart && event.start < rangeEnd)
        .sort((a, b) => a.start - b.start)
        .slice(0, MAX_CALENDAR_TODO_IMPORTS);
}

/**
 * イベントをTodoリストに追加する
 * @param {Array} events - 追加対象のイベント配列
 * @returns {{added: number, skipped: number}} 追加件数とスキップ件数
 */
function addCalendarEventsToTodos(events) {
    let added = 0;
    let skipped = 0;

    events.forEach(event => {
        // 同じカレンダーイベントを何度同期してもTodoを重複作成しない。
        if (hasTodo(todo => todo.source === 'google-calendar' && todo.calendarEventId === event.id)) {
            skipped += 1;
            return;
        }

        addTodoItem({
            text: formatCalendarTodoText(event),
            completed: false,
            source: 'google-calendar',
            calendarEventId: event.id,
            calendarStart: event.start.toISOString()
        });
        added += 1;
    });

    if (added > 0) {
        persistAndRenderTodos();
    }

    return { added, skipped };
}

/**
 * Todoアイテム用のテキストにフォーマットする
 * @param {Object} event - カレンダーイベント
 * @returns {string} フォーマットされたテキスト
 */
function formatCalendarTodoText(event) {
    return `${formatCalendarEventStart(event.start, event.isAllDay)} ${event.summary}`;
}

/**
 * イベントの開始時刻をフォーマットする
 * @param {Date} date - 開始時刻
 * @param {boolean} isAllDay - 終日イベントかどうか
 * @returns {string} フォーマットされた日時文字列
 */
function formatCalendarEventStart(date, isAllDay) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });

    if (isAllDay) {
        return `${month}/${day}(${weekday})`;
    }

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}(${weekday}) ${hour}:${minute}`;
}

/**
 * 取り込み期間（日数）をパース・検証する
 * @param {string|number} value - パースする値
 * @returns {number} 妥当な日数（デフォルトへのフォールバックあり）
 */
function parseCalendarLookaheadDays(value) {
    const days = Number.parseInt(value, 10);
    if (![3, 7, 14, 30].includes(days)) return DEFAULT_CALENDAR_LOOKAHEAD_DAYS;
    return days;
}

/**
 * 今日の開始時刻（0時0分0秒）を取得する
 * @returns {Date} 今日の0時のDateオブジェクト
 */
function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
})();
