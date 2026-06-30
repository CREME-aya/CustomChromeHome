const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('js/unified-agenda.js', 'utf8');
const sandbox = {
    window: {},
    console,
    document: {
        getElementById: () => null
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { buildUnifiedAgendaItems } = sandbox.window.UnifiedAgenda;

const items = buildUnifiedAgendaItems({
    now: new Date('2026-06-26T00:00:00+09:00'),
    calendarEvents: [
        {
            id: 'event-1',
            summary: '朝会',
            start: { dateTime: '2026-06-26T09:00:00+09:00' },
            end: { dateTime: '2026-06-26T09:30:00+09:00' },
            location: '会議室'
        },
        {
            id: 'event-out-of-range',
            summary: '遠い予定',
            start: { date: '2026-07-20' },
            end: { date: '2026-07-21' }
        }
    ],
    googleTasks: [
        {
            id: 'task-1',
            title: '期限ありタスク',
            status: 'needsAction',
            due: '2026-06-27T00:00:00.000Z'
        },
        {
            id: 'task-2',
            title: '完了タスク',
            status: 'completed'
        }
    ],
    todos: [
        { text: 'ローカルタスク', completed: false },
        { text: 'カレンダー取込', completed: false, source: 'google-calendar', calendarStart: '2026-06-26T12:00:00+09:00' }
    ]
});

assert.strictEqual(items.some(item => item.title === '遠い予定'), false);
assert.deepStrictEqual(
    Array.from(items.slice(0, 3).map(item => item.title)),
    ['朝会', 'カレンダー取込', '期限ありタスク']
);
assert.strictEqual(items.at(-1).title, '完了タスク');
assert.strictEqual(items.find(item => item.title === 'ローカルタスク').isUndated, true);
assert.strictEqual(items.find(item => item.title === '朝会').sourceLabel, 'Google カレンダー');

console.log('PASS unified agenda item normalization and ordering');
