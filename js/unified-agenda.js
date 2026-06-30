// ==========================================
// 予定・タスク統合ビュー
// ==========================================
(function() {
const AGENDA_LOOKAHEAD_DAYS = 14;
const UNDATED_TIMESTAMP = Number.MAX_SAFE_INTEGER;

window.UnifiedAgenda = {
    init,
    refresh,
    buildUnifiedAgendaItems
};

function init() {
    document.getElementById('unified-agenda-refresh-btn')
        ?.addEventListener('click', refresh);
    refresh();
}

function refresh() {
    renderAgenda(buildUnifiedAgendaItems({
        now: new Date(),
        todos: readJsonFromStorage(STORAGE_KEY_TODOS, []),
        calendarEvents: readJsonFromStorage(STORAGE_KEY_GOOGLE_CALENDAR_CACHE, []),
        googleTasks: readJsonFromStorage(STORAGE_KEY_GOOGLE_TASKS_CACHE, [])
    }));
}

function buildUnifiedAgendaItems({ now = new Date(), todos = [], calendarEvents = [], googleTasks = [] } = {}) {
    const rangeEnd = addDays(startOfDay(now), AGENDA_LOOKAHEAD_DAYS);
    const normalizedItems = [
        ...calendarEvents.map(normalizeCalendarEvent),
        ...googleTasks.map(normalizeGoogleTask),
        ...todos.map(normalizeLocalTodo)
    ].filter(Boolean);

    return normalizedItems
        .filter(item => item.isUndated || item.completed || item.timestamp < rangeEnd.getTime())
        .sort(compareAgendaItems);
}

function normalizeCalendarEvent(event) {
    const startValue = event?.start?.dateTime || event?.start?.date;
    const endValue = event?.end?.dateTime || event?.end?.date;
    const startDate = parseDate(startValue);
    if (!startDate) return null;

    return {
        id: `calendar:${event.id || event.iCalUID || startValue}`,
        type: 'event',
        sourceLabel: 'Google カレンダー',
        title: event.summary || '(無題)',
        meta: formatEventTime(startValue, endValue, event.location),
        timestamp: startDate.getTime(),
        isUndated: false,
        completed: false,
        url: event.htmlLink || ''
    };
}

function normalizeGoogleTask(task) {
    const dueDate = parseDate(task?.due);
    const isCompleted = task?.status === 'completed';

    return {
        id: `google-task:${task?.id || task?.title || ''}`,
        type: 'task',
        sourceLabel: 'Google Tasks',
        title: task?.title || '(無題)',
        meta: dueDate ? `期限 ${formatDateTime(dueDate, true)}` : '期限なし',
        timestamp: dueDate ? dueDate.getTime() : UNDATED_TIMESTAMP,
        isUndated: !dueDate,
        completed: isCompleted,
        url: task?.webViewLink || ''
    };
}

function normalizeLocalTodo(todo, index) {
    const dateValue = todo?.due || todo?.calendarStart || todo?.date || '';
    const dueDate = parseDate(dateValue);

    return {
        id: `todo:${index}:${todo?.text || ''}`,
        type: 'todo',
        sourceLabel: todo?.source === 'google-calendar' ? 'ToDo / カレンダー取込' : 'ローカル ToDo',
        title: todo?.text || '(無題)',
        meta: dueDate ? `期限 ${formatDateTime(dueDate, true)}` : '期限なし',
        timestamp: dueDate ? dueDate.getTime() : UNDATED_TIMESTAMP,
        isUndated: !dueDate,
        completed: Boolean(todo?.completed),
        url: ''
    };
}

function compareAgendaItems(left, right) {
    if (left.completed !== right.completed) return left.completed ? 1 : -1;
    if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
    return left.title.localeCompare(right.title, 'ja');
}

function renderAgenda(items) {
    const list = document.getElementById('unified-agenda-list');
    const summary = document.getElementById('unified-agenda-summary');
    if (!list) return;

    list.replaceChildren();
    if (summary) {
        const actionableCount = items.filter(item => !item.completed).length;
        summary.textContent = `未完了 ${actionableCount} / 全体 ${items.length}`;
    }

    if (items.length === 0) {
        window.ApiUI.setEmpty('unified-agenda-list', '表示できる予定・タスクはありません。');
        return;
    }

    const groups = groupAgendaItems(items);
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'agenda-group';

        const header = document.createElement('div');
        header.className = 'agenda-group-title';
        header.textContent = group.label;
        groupElement.appendChild(header);

        group.items.forEach(item => groupElement.appendChild(createAgendaItem(item)));
        list.appendChild(groupElement);
    });
}

function groupAgendaItems(items) {
    const groups = new Map();
    items.forEach(item => {
        const label = item.isUndated ? '期限なし' : formatGroupDate(new Date(item.timestamp));
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(item);
    });

    return Array.from(groups.entries()).map(([label, groupItems]) => ({
        label,
        items: groupItems
    }));
}

function createAgendaItem(item) {
    const row = document.createElement(item.url ? 'a' : 'div');
    row.className = `agenda-item agenda-item-${item.type} ${item.completed ? 'completed' : ''}`;
    if (item.url) {
        row.href = item.url;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
    }

    const body = document.createElement('div');
    body.className = 'agenda-item-body';

    const title = document.createElement('div');
    title.className = 'agenda-item-title';
    title.textContent = item.title;

    const meta = document.createElement('div');
    meta.className = 'agenda-item-meta';
    meta.textContent = `${item.sourceLabel} / ${item.meta}`;

    const badge = document.createElement('span');
    badge.className = 'agenda-type-badge';
    badge.textContent = item.type === 'event' ? '予定' : 'タスク';

    body.append(title, meta);
    row.append(body, badge);
    return row;
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function addDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
}

function formatGroupDate(date) {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    const dayDiff = Math.round((target - today) / 86400000);
    if (dayDiff === 0) return '今日';
    if (dayDiff === 1) return '明日';
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

function formatDateTime(date, omitMidnight = false) {
    if (omitMidnight && date.getHours() === 0 && date.getMinutes() === 0) {
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
    }
    return date.toLocaleString('ja-JP', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatEventTime(startValue, endValue, location) {
    const startDate = parseDate(startValue);
    const endDate = parseDate(endValue);
    const isAllDay = Boolean(startValue && !String(startValue).includes('T'));
    const timeLabel = isAllDay
        ? '終日'
        : `${formatClock(startDate)}${endDate ? `-${formatClock(endDate)}` : ''}`;
    return location ? `${timeLabel} / ${location}` : timeLabel;
}

function formatClock(date) {
    if (!date) return '';
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}
})();
