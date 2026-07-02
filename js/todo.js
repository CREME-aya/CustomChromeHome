// ==========================================
// Todo 機能
// ==========================================
(function() {
/**
 * @type {Array<{text: string, completed: boolean, source?: string}>}
 * @description 管理対象のTodoリストを保持する配列
 */
let todos = [];

window.initTodo = initTodo;
window.addTodoItem = addTodoItem;
window.hasTodo = hasTodo;
window.persistAndRenderTodos = persistAndRenderTodos;

/**
 * Todo機能の初期化処理
 * 保存済みTodoの描画とイベントリスナーの登録を行う
 */
function initTodo() {
    // 保存済みTodoを先に描画してから、入力フォームのイベントを接続する。
    todos = readTodos();
    renderTodos();

    const input = document.getElementById('todo-input');
    const btn = document.getElementById('todo-add-btn');
    if (input && btn) {
        btn.addEventListener('click', () => addTodo(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo(input.value);
        });
    }
}

/**
 * ストレージからTodoリストを読み込む
 * @returns {Array<{text: string, completed: boolean, source?: string}>}
 */
function readTodos() {
    return readJsonFromStorage(STORAGE_KEY_TODOS, []);
}

/**
 * TodoリストをDOMに描画する
 */
function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    // Todoの状態をDOMから逆算せず、配列を唯一の描画元として扱う。
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            saveTodos();
            renderTodos();
            window.UnifiedAgenda?.refresh?.();
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        const textWrap = document.createElement('div');
        textWrap.className = 'todo-text-wrap';
        textWrap.appendChild(span);

        if (todo.source === 'google-calendar') {
            // カレンダー由来のTodoは手入力Todoと区別できるように出所を表示する。
            const meta = document.createElement('span');
            meta.className = 'todo-meta';
            meta.textContent = 'Googleカレンダー';
            textWrap.appendChild(meta);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'todo-delete-btn';
        delBtn.innerHTML = '×';
        delBtn.addEventListener('click', () => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
            window.UnifiedAgenda?.refresh?.();
        });

        li.appendChild(checkbox);
        li.appendChild(textWrap);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

/**
 * 新しいTodoを追加する
 * @param {string} text - 追加するTodoのテキスト
 */
function addTodo(text) {
    const todoText = text.trim();
    if (!todoText) return;

    // 手入力のTodoは直近の入力が見つけやすいよう先頭へ追加する。
    todos.unshift({ text: todoText, completed: false });
    saveTodos();
    renderTodos();
    window.UnifiedAgenda?.refresh?.();

    const input = document.getElementById('todo-input');
    if (input) input.value = '';
}

/**
 * 外部連携からのTodoアイテムを追加する
 * @param {{text: string, completed: boolean, source?: string}} todo - 追加するTodoオブジェクト
 */
function addTodoItem(todo) {
    // 外部連携からの追加は呼び出し側でまとめて保存・再描画できるようにする。
    todos.push(todo);
}

/**
 * 条件に一致するTodoが存在するか判定する
 * @param {function(object): boolean} predicate - 判定関数
 * @returns {boolean}
 */
function hasTodo(predicate) {
    return todos.some(predicate);
}

/**
 * Todoリストを保存し、再描画を行う
 */
function persistAndRenderTodos() {
    saveTodos();
    renderTodos();
    window.UnifiedAgenda?.refresh?.();
}

/**
 * Todoリストをストレージに保存する
 */
function saveTodos() {
    writeJsonToStorage(STORAGE_KEY_TODOS, todos);
}
})();
