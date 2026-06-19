// ==========================================
// Todo 機能
// ==========================================
let todos = [];

function initTodo() {
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

function readTodos() {
    return readJsonFromStorage(STORAGE_KEY_TODOS, []);
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

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
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        const textWrap = document.createElement('div');
        textWrap.className = 'todo-text-wrap';
        textWrap.appendChild(span);

        if (todo.source === 'google-calendar') {
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
        });

        li.appendChild(checkbox);
        li.appendChild(textWrap);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addTodo(text) {
    const todoText = text.trim();
    if (!todoText) return;

    todos.unshift({ text: todoText, completed: false });
    saveTodos();
    renderTodos();

    const input = document.getElementById('todo-input');
    if (input) input.value = '';
}

function addTodoItem(todo) {
    todos.push(todo);
}

function hasTodo(predicate) {
    return todos.some(predicate);
}

function persistAndRenderTodos() {
    saveTodos();
    renderTodos();
}

function saveTodos() {
    writeJsonToStorage(STORAGE_KEY_TODOS, todos);
}
