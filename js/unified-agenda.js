// ==========================================
// 予定・タスク統合ビュー
// ==========================================
(function() {
/**
 * 向こう何日間の予定を取得するか
 * @type {number}
 */
const AGENDA_LOOKAHEAD_DAYS = 14;

/**
 * 期限なしタスク用のソート用タイムスタンプ（末尾へ配置するため最大値を使用）
 * @type {number}
 */
const UNDATED_TIMESTAMP = Number.MAX_SAFE_INTEGER;

window.UnifiedAgenda = {
    init,
    refresh,
    buildUnifiedAgendaItems
};

/**
 * アジェンダビューを初期化し、イベントリスナーを登録する
 */
function init() {
    document.getElementById('unified-agenda-refresh-btn')
        ?.addEventListener('click', refresh);
    refresh();
}

/**
 * ストレージのデータから予定・タスクを再読み込みし、画面を更新する
 */
function refresh() {
    renderAgenda(buildUnifiedAgendaItems({
        now: new Date(),
        todos: readJsonFromStorage(STORAGE_KEY_TODOS, []),
        calendarEvents: readJsonFromStorage(STORAGE_KEY_GOOGLE_CALENDAR_CACHE, []),
        googleTasks: readJsonFromStorage(STORAGE_KEY_GOOGLE_TASKS_CACHE, [])
    }));
}

/**
 * 複数のソースから予定・タスクを収集し、ソート・正規化された統合リストを生成する
 * @param {Object} params - 統合対象のデータ
 * @param {Date} [params.now=new Date()] - 基準となる現在日時
 * @param {Array} [params.todos=[]] - ローカルのToDoリスト
 * @param {Array} [params.calendarEvents=[]] - カレンダーの予定リスト
 * @param {Array} [params.googleTasks=[]] - Google Tasksのリスト
 * @returns {Array<Object>} 統合・ソート済みの予定アイテム
 */
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

/**
 * Googleカレンダーの予定を統合アジェンダ用の共通形式に変換する
 * @param {Object} event - カレンダーの予定オブジェクト
 * @returns {Object|null} 共通形式のアイテム、または変換不可の場合null
 */
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

/**
 * Google Tasksのタスクを統合アジェンダ用の共通形式に変換する
 * @param {Object} task - Tasksのタスクオブジェクト
 * @returns {Object} 共通形式のアイテム
 */
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

/**
 * ローカルのToDoを統合アジェンダ用の共通形式に変換する
 * @param {Object} todo - ToDoオブジェクト
 * @param {number} index - ToDoのインデックス
 * @returns {Object} 共通形式のアイテム
 */
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

/**
 * アジェンダアイテムの並び替え用比較関数
 * @param {Object} left - 比較対象1
 * @param {Object} right - 比較対象2
 * @returns {number} 比較結果（完了状態・タイムスタンプ・タイトルの順で評価）
 */
function compareAgendaItems(left, right) {
    if (left.completed !== right.completed) return left.completed ? 1 : -1;
    if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
    return left.title.localeCompare(right.title, 'ja');
}

/**
 * 統合されたアジェンダアイテムをDOMに描画する
 * @param {Array<Object>} items - 描画するアイテムのリスト
 */
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
        // CSS: .agenda-group (日付ごとのグループコンテナ)
        groupElement.className = 'agenda-group';

        const header = document.createElement('div');
        // CSS: .agenda-group-title (グループ見出し)
        header.className = 'agenda-group-title';
        header.textContent = group.label;
        groupElement.appendChild(header);

        group.items.forEach(item => groupElement.appendChild(createAgendaItem(item)));
        list.appendChild(groupElement);
    });
}

/**
 * アジェンダアイテムを日付ごとにグループ化する
 * @param {Array<Object>} items - グループ化対象のアイテムリスト
 * @returns {Array<{label: string, items: Array<Object>}>} グループ化されたデータの配列
 */
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

/**
 * 個別のアジェンダアイテムのDOM要素を作成する
 * @param {Object} item - 描画するアジェンダアイテム
 * @returns {HTMLElement} アイテムのDOM要素
 */
function createAgendaItem(item) {
    const row = document.createElement(item.url ? 'a' : 'div');
    // CSS: .agenda-item, .agenda-item-event, .agenda-item-task, .agenda-item-todo, .completed (アイテムコンテナや状態クラス)
    row.className = `agenda-item agenda-item-${item.type} ${item.completed ? 'completed' : ''}`;
    if (item.url) {
        row.href = item.url;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
    }

    const body = document.createElement('div');
    // CSS: .agenda-item-body (アイテムの主要コンテンツ部分)
    body.className = 'agenda-item-body';

    const title = document.createElement('div');
    // CSS: .agenda-item-title (アイテムのタイトル)
    title.className = 'agenda-item-title';
    title.textContent = item.title;

    const meta = document.createElement('div');
    // CSS: .agenda-item-meta (メタ情報)
    meta.className = 'agenda-item-meta';
    meta.textContent = `${item.sourceLabel} / ${item.meta}`;

    const badge = document.createElement('span');
    // CSS: .agenda-type-badge (タイプを示すバッジ)
    badge.className = 'agenda-type-badge';
    badge.textContent = item.type === 'event' ? '予定' : 'タスク';

    body.append(title, meta);
    row.append(body, badge);
    return row;
}

/**
 * 文字列をDateオブジェクトとして解析する
 * @param {string|number|Date} value - 解析する値
 * @returns {Date|null} 解析成功時はDateオブジェクト、失敗時はnull
 */
function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 指定日時の0時0分0秒のDateオブジェクトを取得する
 * @param {string|number|Date} value - 基準となる日時
 * @returns {Date} その日の開始日時
 */
function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * 指定日時に指定日数を加算したDateオブジェクトを取得する
 * @param {string|number|Date} value - 基準となる日時
 * @param {number} days - 加算する日数
 * @returns {Date} 加算後の日時
 */
function addDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * グループ表示用の日付ラベルをフォーマットする（今日・明日など）
 * @param {Date} date - フォーマット対象の日付
 * @returns {string} フォーマットされた日付ラベル
 */
function formatGroupDate(date) {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    const dayDiff = Math.round((target - today) / 86400000);
    if (dayDiff === 0) return '今日';
    if (dayDiff === 1) return '明日';
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

/**
 * 日時をユーザー表示用にフォーマットする
 * @param {Date} date - フォーマット対象の日時
 * @param {boolean} [omitMidnight=false] - 0時0分の場合は時刻を省略するかどうか
 * @returns {string} フォーマットされた日時文字列
 */
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

/**
 * カレンダー予定の期間ラベルと場所をフォーマットする
 * @param {string} startValue - 開始日時の文字列
 * @param {string} endValue - 終了日時の文字列
 * @param {string} [location] - 場所
 * @returns {string} フォーマットされた予定情報
 */
function formatEventTime(startValue, endValue, location) {
    const startDate = parseDate(startValue);
    const endDate = parseDate(endValue);
    const isAllDay = Boolean(startValue && !String(startValue).includes('T'));
    const timeLabel = isAllDay
        ? '終日'
        : `${formatClock(startDate)}${endDate ? `-${formatClock(endDate)}` : ''}`;
    return location ? `${timeLabel} / ${location}` : timeLabel;
}

/**
 * 日時から時刻部分（時:分）をフォーマットする
 * @param {Date} date - フォーマット対象の日時
 * @returns {string} フォーマットされた時刻文字列
 */
function formatClock(date) {
    if (!date) return '';
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}
})();
