// ==========================================
// Google Calendar -> Todo 取り込み
// ==========================================
(function() {
window.initCalendarTodoImport = initCalendarTodoImport;

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

function saveCalendarImportSettings(icalUrl, lookaheadDays) {
    localStorage.setItem(STORAGE_KEY_CALENDAR_ICAL_URL, icalUrl.trim());
    localStorage.setItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS, String(parseCalendarLookaheadDays(lookaheadDays)));
}

function updateCalendarImportStatus(status, message) {
    if (!status) return;

    if (message) {
        status.textContent = message;
        return;
    }

    const icalUrl = localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
    status.textContent = icalUrl ? '設定済み' : '未設定';
}

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

function getCalendarIcalUrlFromSettings() {
    const input = document.getElementById('calendar-ical-url-input');
    const select = document.getElementById('calendar-lookahead-select');

    // 設定画面で編集途中の値があれば、同期実行前に保存へ反映する。
    if (input || select) {
        saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS));
    }

    return localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
}

async function fetchGoogleCalendarEvents(icalUrl) {
    const res = await fetch(icalUrl);
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);

    const icsText = await res.text();
    return window.parseIcsEvents(icsText);
}

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

function formatCalendarTodoText(event) {
    return `${formatCalendarEventStart(event.start, event.isAllDay)} ${event.summary}`;
}

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

function parseCalendarLookaheadDays(value) {
    const days = Number.parseInt(value, 10);
    if (![3, 7, 14, 30].includes(days)) return DEFAULT_CALENDAR_LOOKAHEAD_DAYS;
    return days;
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
})();
