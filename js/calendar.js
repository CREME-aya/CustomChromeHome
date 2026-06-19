// ==========================================
// Google Calendar -> Todo 取り込み
// ==========================================
function initCalendarTodoImport() {
    const urlInput = document.getElementById('calendar-ical-url-input');
    const lookaheadSelect = document.getElementById('calendar-lookahead-select');
    const saveButton = document.getElementById('calendar-save-btn');
    const syncButton = document.getElementById('calendar-sync-btn');
    const widgetImportButton = document.getElementById('calendar-import-btn');
    const status = document.getElementById('calendar-import-status');

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
        if (!status) alert('Googleカレンダーの iCal URLを設定してください。');
        return;
    }

    updateCalendarImportStatus(status, '予定を取得中...');

    try {
        const events = await fetchGoogleCalendarEvents(icalUrl);
        const importableEvents = filterImportableCalendarEvents(events);
        const result = addCalendarEventsToTodos(importableEvents);
        updateCalendarImportStatus(status, `${result.added}件追加 / ${result.skipped}件スキップ`);
    } catch (e) {
        console.error(e);
        updateCalendarImportStatus(status, '予定の取得に失敗しました');
    }
}

function getCalendarIcalUrlFromSettings() {
    const input = document.getElementById('calendar-ical-url-input');
    const select = document.getElementById('calendar-lookahead-select');

    if (input || select) {
        saveCalendarImportSettings(input?.value || '', select?.value || String(DEFAULT_CALENDAR_LOOKAHEAD_DAYS));
    }

    return localStorage.getItem(STORAGE_KEY_CALENDAR_ICAL_URL) || '';
}

async function fetchGoogleCalendarEvents(icalUrl) {
    const res = await fetch(icalUrl);
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);

    const icsText = await res.text();
    return parseIcsEvents(icsText);
}

function filterImportableCalendarEvents(events) {
    const lookaheadDays = parseCalendarLookaheadDays(localStorage.getItem(STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS));
    const rangeStart = startOfToday();
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + lookaheadDays);

    return events
        .filter(event => event.start && event.start >= rangeStart && event.start < rangeEnd)
        .sort((a, b) => a.start - b.start)
        .slice(0, MAX_CALENDAR_TODO_IMPORTS);
}

function addCalendarEventsToTodos(events) {
    let added = 0;
    let skipped = 0;

    events.forEach(event => {
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

function parseIcsEvents(icsText) {
    const events = [];
    let currentEvent = null;

    unfoldIcsLines(icsText).forEach(line => {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            return;
        }

        if (line === 'END:VEVENT') {
            const event = normalizeIcsEvent(currentEvent);
            if (event) events.push(event);
            currentEvent = null;
            return;
        }

        if (!currentEvent) return;

        const property = parseIcsProperty(line);
        if (!property) return;

        currentEvent[property.name] = property;
    });

    return events;
}

function unfoldIcsLines(icsText) {
    return icsText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .reduce((lines, line) => {
            if (/^[ \t]/.test(line) && lines.length > 0) {
                lines[lines.length - 1] += line.slice(1);
            } else {
                lines.push(line);
            }
            return lines;
        }, []);
}

function parseIcsProperty(line) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return null;

    const rawName = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name, ...paramParts] = rawName.split(';');

    return {
        name: name.toUpperCase(),
        params: parseIcsParams(paramParts),
        value
    };
}

function parseIcsParams(paramParts) {
    return paramParts.reduce((params, part) => {
        const [key, value] = part.split('=');
        if (key && value) params[key.toUpperCase()] = value.replace(/^"|"$/g, '');
        return params;
    }, {});
}

function normalizeIcsEvent(rawEvent) {
    if (!rawEvent?.DTSTART) return null;

    const start = parseIcsDate(rawEvent.DTSTART);
    if (!start.date) return null;

    const uid = unescapeIcsText(rawEvent.UID?.value || `${rawEvent.SUMMARY?.value || 'event'}-${rawEvent.DTSTART.value}`);

    return {
        id: uid,
        summary: unescapeIcsText(rawEvent.SUMMARY?.value || '予定'),
        start: start.date,
        isAllDay: start.isAllDay
    };
}

function parseIcsDate(property) {
    const value = property.value;
    const isDateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);

    if (isDateOnly) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6)) - 1;
        const day = Number(value.slice(6, 8));
        return { date: new Date(year, month, day), isAllDay: true };
    }

    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) return { date: null, isAllDay: false };

    const [, year, month, day, hour, minute, second, utcSuffix] = match;
    const date = utcSuffix
        ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
        : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

    return { date, isAllDay: false };
}

function unescapeIcsText(text) {
    return text
        .replace(/\\n/gi, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}
