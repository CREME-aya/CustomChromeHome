// ==========================================
// Todo 機能
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 変数「todos」を、この後の処理で使う値として用意する。
let todos = [];

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initTodo = initTodo;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.addTodoItem = addTodoItem;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.hasTodo = hasTodo;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.persistAndRenderTodos = persistAndRenderTodos;

// 詳細: 関数「initTodo」の処理ブロックを開始する。
function initTodo() {
    // 保存済みTodoを先に描画してから、入力フォームのイベントを接続する。
    // 詳細: 次の処理行「todos = readTodos();」の役割を、その場の制御フローに組み込む。
    todos = readTodos();
    // 詳細: 次の処理行「renderTodos();」の役割を、その場の制御フローに組み込む。
    renderTodos();

    // 詳細: 変数「input」を、この後の処理で使う値として用意する。
    const input = document.getElementById('todo-input');
    // 詳細: 変数「btn」を、この後の処理で使う値として用意する。
    const btn = document.getElementById('todo-add-btn');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (input && btn) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        btn.addEventListener('click', () => addTodo(input.value));
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        input.addEventListener('keypress', (e) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (e.key === 'Enter') addTodo(input.value);
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「readTodos」の処理ブロックを開始する。
function readTodos() {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return readJsonFromStorage(STORAGE_KEY_TODOS, []);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「renderTodos」の処理ブロックを開始する。
function renderTodos() {
    // 詳細: 変数「list」を、この後の処理で使う値として用意する。
    const list = document.getElementById('todo-list');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!list) return;
    // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
    list.innerHTML = '';

    // Todoの状態をDOMから逆算せず、配列を唯一の描画元として扱う。
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    todos.forEach((todo, index) => {
        // 詳細: 変数「li」を、この後の処理で使う値として用意する。
        const li = document.createElement('li');
        // 詳細: 次の処理行「li.className = バッククォートtodo-item ${todo.completed ? 'completed' : ''}バッククォート;」の役割を、その場の制御フローに組み込む。
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        // 詳細: 変数「checkbox」を、この後の処理で使う値として用意する。
        const checkbox = document.createElement('input');
        // 詳細: 次の処理行「checkbox.type = 'checkbox';」の役割を、その場の制御フローに組み込む。
        checkbox.type = 'checkbox';
        // 詳細: 次の処理行「checkbox.checked = todo.completed;」の役割を、その場の制御フローに組み込む。
        checkbox.checked = todo.completed;
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        checkbox.addEventListener('change', () => {
            // 詳細: 次の処理行「todo.completed = checkbox.checked;」の役割を、その場の制御フローに組み込む。
            todo.completed = checkbox.checked;
            // 詳細: 次の処理行「saveTodos();」の役割を、その場の制御フローに組み込む。
            saveTodos();
            // 詳細: 次の処理行「renderTodos();」の役割を、その場の制御フローに組み込む。
            renderTodos();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });

        // 詳細: 変数「span」を、この後の処理で使う値として用意する。
        const span = document.createElement('span');
        // 詳細: 次の処理行「span.className = 'todo-text';」の役割を、その場の制御フローに組み込む。
        span.className = 'todo-text';
        // 詳細: 画面に表示するテキストを安全に更新する。
        span.textContent = todo.text;

        // 詳細: 変数「textWrap」を、この後の処理で使う値として用意する。
        const textWrap = document.createElement('div');
        // 詳細: 次の処理行「textWrap.className = 'todo-text-wrap';」の役割を、その場の制御フローに組み込む。
        textWrap.className = 'todo-text-wrap';
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        textWrap.appendChild(span);

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (todo.source === 'google-calendar') {
            // カレンダー由来のTodoは手入力Todoと区別できるように出所を表示する。
            // 詳細: 変数「meta」を、この後の処理で使う値として用意する。
            const meta = document.createElement('span');
            // 詳細: 次の処理行「meta.className = 'todo-meta';」の役割を、その場の制御フローに組み込む。
            meta.className = 'todo-meta';
            // 詳細: 画面に表示するテキストを安全に更新する。
            meta.textContent = 'Googleカレンダー';
            // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
            textWrap.appendChild(meta);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 変数「delBtn」を、この後の処理で使う値として用意する。
        const delBtn = document.createElement('button');
        // 詳細: 次の処理行「delBtn.className = 'todo-delete-btn';」の役割を、その場の制御フローに組み込む。
        delBtn.className = 'todo-delete-btn';
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        delBtn.innerHTML = '×';
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        delBtn.addEventListener('click', () => {
            // 詳細: 次の処理行「todos.splice(index, 1);」の役割を、その場の制御フローに組み込む。
            todos.splice(index, 1);
            // 詳細: 次の処理行「saveTodos();」の役割を、その場の制御フローに組み込む。
            saveTodos();
            // 詳細: 次の処理行「renderTodos();」の役割を、その場の制御フローに組み込む。
            renderTodos();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });

        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        li.appendChild(checkbox);
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        li.appendChild(textWrap);
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        li.appendChild(delBtn);
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        list.appendChild(li);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「addTodo」の処理ブロックを開始する。
function addTodo(text) {
    // 詳細: 変数「todoText」を、この後の処理で使う値として用意する。
    const todoText = text.trim();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!todoText) return;

    // 手入力のTodoは直近の入力が見つけやすいよう先頭へ追加する。
    // 詳細: 次の処理行「todos.unshift({ text: todoText, completed: false });」の役割を、その場の制御フローに組み込む。
    todos.unshift({ text: todoText, completed: false });
    // 詳細: 次の処理行「saveTodos();」の役割を、その場の制御フローに組み込む。
    saveTodos();
    // 詳細: 次の処理行「renderTodos();」の役割を、その場の制御フローに組み込む。
    renderTodos();

    // 詳細: 変数「input」を、この後の処理で使う値として用意する。
    const input = document.getElementById('todo-input');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (input) input.value = '';
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「addTodoItem」の処理ブロックを開始する。
function addTodoItem(todo) {
    // 外部連携からの追加は呼び出し側でまとめて保存・再描画できるようにする。
    // 詳細: 次の処理行「todos.push(todo);」の役割を、その場の制御フローに組み込む。
    todos.push(todo);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「hasTodo」の処理ブロックを開始する。
function hasTodo(predicate) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return todos.some(predicate);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「persistAndRenderTodos」の処理ブロックを開始する。
function persistAndRenderTodos() {
    // 詳細: 次の処理行「saveTodos();」の役割を、その場の制御フローに組み込む。
    saveTodos();
    // 詳細: 次の処理行「renderTodos();」の役割を、その場の制御フローに組み込む。
    renderTodos();
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「saveTodos」の処理ブロックを開始する。
function saveTodos() {
    // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_TODOS, todos);」の役割を、その場の制御フローに組み込む。
    writeJsonToStorage(STORAGE_KEY_TODOS, todos);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
