// ==========================================
// Google カレンダー ウィジェット
// ==========================================
(function() {
const GoogleAuth = window.GoogleAuth;
let currentEvents = [];

window.GoogleCalendar = {
    init,
    loadEvents,
    addEvent
};

function init() {
    const syncBtn = document.getElementById('google-calendar-sync-btn');
    const formToggle = document.getElementById('google-calendar-form-toggle');
    const formContainer = document.getElementById('google-calendar-form-container');
    const addBtn = document.getElementById('google-calendar-add-event-btn');

    syncBtn?.addEventListener('click', () => loadEvents(true));
    
    formToggle?.addEventListener('click', () => {
        formContainer?.classList.toggle('hidden');
        formToggle.textContent = formContainer?.classList.contains('hidden') ? '▼ 新規予定を追加' : '▲ 閉じる';
    });

    addBtn?.addEventListener('click', handleAddEventSubmit);

    // キャッシュがあれば先に読み込む
    const cached = localStorage.getItem(STORAGE_KEY_GOOGLE_CALENDAR_CACHE);
    if (cached) {
        try {
            currentEvents = JSON.parse(cached);
            renderEvents();
        } catch(e) {
            console.warn("Google Calendar cache parse failed", e);
        }
    }

    if (GoogleAuth.hasStoredSession()) {
        loadEvents();
    } else {
        renderUnauthenticated();
    }
}

async function loadEvents(force = false) {
    if (!GoogleAuth.hasStoredSession()) {
        renderUnauthenticated();
        return;
    }

    setLoading(true);

    try {
        const token = await GoogleAuth.getValidAccessToken();
        if (!token) {
            setLoading(false);
            renderUnauthenticated();
            return;
        }

        const selectedCalendars = getSelectedCalendars();
        
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const allEvents = [];
        const calendarIds = selectedCalendars.length > 0 ? selectedCalendars : ['primary'];

        for (const calendarId of calendarIds) {
            try {
                const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.status === 401) {
                    throw new Error("Unauthorized");
                }
                
                if (!res.ok) continue;
                
                const data = await res.json();
                if (data.items) {
                    allEvents.push(...data.items);
                }
            } catch(err) {
                console.warn(`Failed to fetch events for calendar: ${calendarId}`, err);
                if (err.message === "Unauthorized") {
                    throw err; // 401エラーの場合は外側のcatchに再スローして認証エラー処理を行う
                }
            }
        }

        currentEvents = allEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date);
            const dateB = new Date(b.start.dateTime || b.start.date);
            return dateA - dateB;
        });

        localStorage.setItem(STORAGE_KEY_GOOGLE_CALENDAR_CACHE, JSON.stringify(currentEvents));
        renderEvents();
    } catch (e) {
        console.error("Google Calendar load failed", e);
        setLoading(false);
        if (currentEvents.length > 0) {
            window.showNotification("Google カレンダーの更新に失敗しました。キャッシュを表示しています。", "warning");
        } else {
            renderError("予定の取得に失敗しました。再試行してください。");
        }
    }
}

async function addEvent(summary, startDateStr, startTimeStr, endTimeStr, location = '') {
    const token = await GoogleAuth.getValidAccessToken();
    if (!token) {
        window.showNotification("Google アカウントとの連携が必要です。", "error");
        return false;
    }

    const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
    const endDateTime = new Date(`${startDateStr}T${endTimeStr}:00`).toISOString();

    const eventBody = {
        summary,
        location,
        start: { dateTime: startDateTime, timeZone: 'Asia/Tokyo' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Tokyo' }
    };

    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventBody)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        window.showNotification("予定を追加しました！", "success");
        loadEvents();
        return true;
    } catch(e) {
        console.error("Google Calendar add event failed", e);
        window.showNotification(`予定の追加に失敗しました。${e.message}`, "error");
        return false;
    }
}

async function handleAddEventSubmit() {
    const summaryInput = document.getElementById('google-calendar-title-input');
    const dateInput = document.getElementById('google-calendar-date-input');
    const startInput = document.getElementById('google-calendar-start-input');
    const endInput = document.getElementById('google-calendar-end-input');
    const locInput = document.getElementById('google-calendar-location-input');

    if (!summaryInput?.value || !dateInput?.value || !startInput?.value || !endInput?.value) {
        window.showNotification("必須項目（タイトル、日付、開始・終了時間）を入力してください。", "error");
        return;
    }

    const success = await addEvent(
        summaryInput.value,
        dateInput.value,
        startInput.value,
        endInput.value,
        locInput?.value || ''
    );

    if (success) {
        summaryInput.value = '';
        locInput.value = '';
        document.getElementById('google-calendar-form-container')?.classList.add('hidden');
        const formToggle = document.getElementById('google-calendar-form-toggle');
        if (formToggle) formToggle.textContent = '▼ 新規予定を追加';
    }
}

function renderEvents() {
    const list = document.getElementById('google-calendar-events-list');
    if (!list) return;

    list.innerHTML = '';
    setLoading(false);

    if (currentEvents.length === 0) {
        list.innerHTML = '<div class="empty-state">7日以内の予定はありません。</div>';
        return;
    }

    const grouped = {};
    currentEvents.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        const dateStr = new Date(start).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(event);
    });

    Object.entries(grouped).forEach(([dateStr, events]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'calendar-day-group';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = dateStr;
        groupEl.appendChild(dayHeader);

        events.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar-event-item';

            const timeStr = event.start.dateTime
                ? `${formatTime(event.start.dateTime)} - ${formatTime(event.end.dateTime)}`
                : '終日';

            const details = document.createElement('div');
            details.className = 'calendar-event-details';

            const titleLink = document.createElement('a');
            titleLink.className = 'calendar-event-title';
            titleLink.href = event.htmlLink || '#';
            titleLink.target = '_blank';
            titleLink.rel = 'noopener noreferrer';
            titleLink.textContent = event.summary || '(無題)';

            const meta = document.createElement('div');
            meta.className = 'calendar-event-meta';
            meta.textContent = `${timeStr}${event.location ? ` ・ ${event.location}` : ''}`;

            details.append(titleLink, meta);

            const actionBtn = document.createElement('button');
            actionBtn.className = 'calendar-event-todo-btn';
            actionBtn.type = 'button';
            actionBtn.textContent = '+ToDo';
            actionBtn.setAttribute('aria-label', `${event.summary}をToDoに追加`);
            actionBtn.addEventListener('click', () => {
                const todoText = `[カレンダー] ${event.summary} (${dateStr} ${timeStr})`;
                if (window.addTodoItem) {
                    const success = window.addTodoItem(todoText);
                    if (success) {
                        window.showNotification("カレンダーの予定をToDoに追加しました！", "success");
                    }
                } else {
                    window.showNotification("ToDoウィジェットが初期化されていません。", "error");
                }
            });

            eventEl.append(details, actionBtn);
            groupEl.appendChild(eventEl);
        });

        list.appendChild(groupEl);
    });
}

function renderUnauthenticated() {
    const list = document.getElementById('google-calendar-events-list');
    if (!list) return;
    setLoading(false);
    list.innerHTML = `
        <div class="empty-state auth-guide">
            <p>Google アカウントと未連携です。設定サイドバーの Google 連携設定を行ってください。</p>
        </div>
    `;
}

function renderError(message) {
    const list = document.getElementById('google-calendar-events-list');
    if (!list) return;
    list.innerHTML = `
        <div class="empty-state error-state">
            <span>⚠️</span>
            <p>${message}</p>
        </div>
    `;
}

function setLoading(isLoading) {
    const list = document.getElementById('google-calendar-events-list');
    if (!list) return;
    if (isLoading) {
        list.innerHTML = '<div class="loading">Google カレンダーから同期中...</div>';
    }
}

function getSelectedCalendars() {
    try {
        const val = localStorage.getItem(STORAGE_KEY_GOOGLE_SELECTED_CALENDARS);
        return val ? JSON.parse(val) : [];
    } catch(e) {
        return [];
    }
}

function formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}
})();
