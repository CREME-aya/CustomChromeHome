// ==========================================
// Google Tasks (Google ToDo) ウィジェット
// ==========================================
(function() {
const GoogleAuth = window.GoogleAuth;
let currentTaskLists = [];
let currentTasks = [];
let selectedListId = '';
let pollIntervalId = null;

window.GoogleTasks = {
    init,
    loadTaskLists,
    loadTasks,
    addTask,
    updateTaskStatus,
    deleteTask
};

function init() {
    const syncBtn = document.getElementById('google-tasks-sync-btn');
    const addBtn = document.getElementById('google-tasks-add-btn');
    const input = document.getElementById('google-tasks-input');
    const select = document.getElementById('google-tasks-list-select');

    syncBtn?.addEventListener('click', () => loadTasks(selectedListId, true));
    addBtn?.addEventListener('click', handleAddTaskSubmit);
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTaskSubmit();
    });

    select?.addEventListener('change', (e) => {
        selectedListId = e.target.value;
        localStorage.setItem(STORAGE_KEY_GOOGLE_SELECTED_TASKLIST, selectedListId);
        loadTasks(selectedListId, true);
    });

    const cachedTasks = localStorage.getItem(STORAGE_KEY_GOOGLE_TASKS_CACHE);
    if (cachedTasks) {
        try {
            currentTasks = JSON.parse(cachedTasks);
            renderTasks();
        } catch(e) {
            console.warn("Google Tasks cache parse failed", e);
        }
    }

    selectedListId = localStorage.getItem(STORAGE_KEY_GOOGLE_SELECTED_TASKLIST) || '';

    if (GoogleAuth.hasStoredSession()) {
        loadTaskLists();
        startPolling();
    } else {
        renderUnauthenticated();
    }
}

function startPolling() {
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(() => {
        if (GoogleAuth.hasStoredSession() && selectedListId) {
            loadTasks(selectedListId, false);
        }
    }, 60000);
}

async function loadTaskLists() {
    const token = await GoogleAuth.getValidAccessToken();
    if (!token) return;

    try {
        const res = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        currentTaskLists = data.items || [];
        
        renderTaskListsDropdown();

        if (currentTaskLists.length > 0) {
            if (!selectedListId || !currentTaskLists.some(l => l.id === selectedListId)) {
                selectedListId = currentTaskLists[0].id;
                localStorage.setItem(STORAGE_KEY_GOOGLE_SELECTED_TASKLIST, selectedListId);
            }
            const select = document.getElementById('google-tasks-list-select');
            if (select) select.value = selectedListId;
            loadTasks(selectedListId);
        }
    } catch(e) {
        console.error("Google Tasks load lists failed", e);
    }
}

async function loadTasks(listId, showLoadingState = true) {
    if (!listId) return;
    if (!GoogleAuth.hasStoredSession()) {
        renderUnauthenticated();
        return;
    }

    if (showLoadingState) setLoading(true);

    try {
        const token = await GoogleAuth.getValidAccessToken();
        if (!token) {
            setLoading(false);
            renderUnauthenticated();
            return;
        }

        const res = await fetch(`https://tasks.googleapis.com/v1/lists/${listId}/tasks?showCompleted=true&maxResults=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        
        currentTasks = (data.items || []).sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(b.updated) - new Date(a.updated);
        });

        localStorage.setItem(STORAGE_KEY_GOOGLE_TASKS_CACHE, JSON.stringify(currentTasks));
        renderTasks();
    } catch(e) {
        console.error("Google Tasks load tasks failed", e);
        setLoading(false);
        if (currentTasks.length > 0) {
            window.showNotification("Google Tasksの同期に失敗しました。キャッシュを表示しています。", "warning");
        } else {
            renderError("タスクの同期に失敗しました。");
        }
    }
}

async function addTask(title) {
    if (!selectedListId) return false;
    const token = await GoogleAuth.getValidAccessToken();
    if (!token) return false;

    try {
        const res = await fetch(`https://tasks.googleapis.com/v1/lists/${selectedListId}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        loadTasks(selectedListId, false);
        return true;
    } catch(e) {
        console.error("Google Tasks add task failed", e);
        window.showNotification(`タスクの追加に失敗しました。${e.message}`, "error");
        return false;
    }
}

async function updateTaskStatus(taskId, title, completed) {
    if (!selectedListId) return false;
    const token = await GoogleAuth.getValidAccessToken();
    if (!token) return false;

    const status = completed ? 'completed' : 'needsAction';
    const body = {
        id: taskId,
        title: title,
        status: status
    };

    if (!completed) {
        body.completed = null;
    }

    try {
        const res = await fetch(`https://tasks.googleapis.com/v1/lists/${selectedListId}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        loadTasks(selectedListId, false);
        return true;
    } catch(e) {
        console.error("Google Tasks update status failed", e);
        window.showNotification(`タスクの更新に失敗しました。${e.message}`, "error");
        return false;
    }
}

async function deleteTask(taskId) {
    if (!selectedListId) return false;
    const token = await GoogleAuth.getValidAccessToken();
    if (!token) return false;

    try {
        const res = await fetch(`https://tasks.googleapis.com/v1/lists/${selectedListId}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        window.showNotification("タスクを削除しました。", "success");
        loadTasks(selectedListId, false);
        return true;
    } catch(e) {
        console.error("Google Tasks delete task failed", e);
        window.showNotification(`タスクの削除に失敗しました。${e.message}`, "error");
        return false;
    }
}

async function handleAddTaskSubmit() {
    const input = document.getElementById('google-tasks-input');
    if (!input || !input.value.trim()) return;

    const val = input.value.trim();
    const success = await addTask(val);
    if (success) {
        input.value = '';
    }
}

function renderTaskListsDropdown() {
    const select = document.getElementById('google-tasks-list-select');
    if (!select) return;

    select.innerHTML = '';
    currentTaskLists.forEach(list => {
        const opt = document.createElement('option');
        opt.value = list.id;
        opt.textContent = list.title;
        select.appendChild(opt);
    });
    select.value = selectedListId;
}

function renderTasks() {
    const listEl = document.getElementById('google-tasks-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    setLoading(false);

    if (currentTasks.length === 0) {
        listEl.innerHTML = '<div class="empty-state">タスクはありません。</div>';
        return;
    }

    currentTasks.forEach(task => {
        const item = document.createElement('li');
        item.className = `todo-item ${task.status === 'completed' ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'completed';
        checkbox.setAttribute('aria-label', `${task.title}の完了状態を切り替え`);
        checkbox.addEventListener('change', () => {
            updateTaskStatus(task.id, task.title, checkbox.checked);
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = task.title;

        const textWrap = document.createElement('div');
        textWrap.className = 'todo-text-wrap';
        textWrap.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️';
        deleteBtn.setAttribute('aria-label', `${task.title}を削除`);
        deleteBtn.addEventListener('click', () => {
            if (confirm(`タスク「${task.title}」を削除してもよろしいですか？`)) {
                deleteTask(task.id);
            }
        });

        item.append(checkbox, textWrap, deleteBtn);
        listEl.appendChild(item);
    });
}

function renderUnauthenticated() {
    const listEl = document.getElementById('google-tasks-list');
    if (!listEl) return;
    setLoading(false);
    listEl.innerHTML = `
        <div class="empty-state auth-guide">
            <p>Google アカウントと未連携です。設定サイドバーの Google 連携設定を行ってください。</p>
        </div>
    `;
}

function renderError(message) {
    const listEl = document.getElementById('google-tasks-list');
    if (!listEl) return;
    listEl.innerHTML = `
        <div class="empty-state error-state">
            <span>⚠️</span>
            <p>${message}</p>
        </div>
    `;
}

function setLoading(isLoading) {
    const listEl = document.getElementById('google-tasks-list');
    if (!listEl) return;
    if (isLoading) {
        listEl.innerHTML = '<div class="loading">Google Tasks と同期中...</div>';
    }
}
})();
