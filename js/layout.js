function toPx(value) {
    return `${value}px`;
}

// ==========================================
// initWidgetSortable — ウィジェットの自由配置（アブソリュート・ドラッグ）とピン留め、リサイズ
// ==========================================
let activeDragElement = null;
let dragStartX = 0;
let dragStartY = 0;
let elementStartX = 0;
let elementStartY = 0;

function initWidgetSortable() {
    const container = document.getElementById('dashboard-main');
    if (!container) return;

    // 1. 各ウィジェットの初期化（ドラッグ有効化、ピン留めボタン追加、状態復元）
    restoreWidgetStates(container);

    // 2. 編集モードトグルの監視
    const editModeToggle = document.getElementById('toggle-edit-mode');
    if (editModeToggle) {
        const applyEditMode = () => {
            const isEnabled = editModeToggle.checked;
            container.classList.toggle('layout-edit-active', isEnabled);
        };
        applyEditMode();
        editModeToggle.addEventListener('change', applyEditMode);
    }

    // 3. ウィンドウリサイズ時の境界制御
    window.addEventListener('resize', handleWindowResize);

    // 4. 編集モード時のみサイズ変更の完了を検知して保存する処理
    container.addEventListener('mouseup', (e) => {
        if (!editModeToggle || !editModeToggle.checked) return;
        const item = e.target.closest('.sortable-item');
        if (item) {
            saveWidgetState(item);
        }
    });
}

// 状態（座標、ピン留め、サイズ）の保存
function saveWidgetState(el) {
    const id = el.getAttribute('data-id');
    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});

    states[id] = {
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
        pinned: el.classList.contains('widget-pinned')
    };

    writeJsonToStorage(STORAGE_KEY_WIDGET_STATES, states);
}

// デフォルトのレイアウト配置の計算（変更前の配置を再現）
function calculateDefaultWidgetPositions(containerWidth) {
    const positions = {};
    const normalWidthPx = toPx(WIDGET_WIDTH_NORMAL);
    const wideWidthPx = toPx(WIDGET_WIDTH_WIDE);

    // 1. Spotify (右上固定)
    positions['widget-spotify'] = {
        position: 'fixed',
        left: `calc(100% - ${toPx(WIDGET_SPOTIFY_RIGHT_OFFSET)})`,
        top: toPx(WIDGET_SPOTIFY_TOP),
        width: normalWidthPx,
        pinned: true
    };

    // 2. 時計と天気（横並びで中央）
    const topRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    const topRowStartX = Math.max(0, (containerWidth - topRowWidth) / 2);
    positions['widget-clock'] = {
        position: 'absolute',
        left: `${topRowStartX}px`,
        top: toPx(WIDGET_TOP_MARGIN),
        width: normalWidthPx
    };
    positions['widget-weather'] = {
        position: 'absolute',
        left: `${topRowStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        top: toPx(WIDGET_TOP_MARGIN),
        width: normalWidthPx
    };

    // 3. マルチAI検索バー (全幅 700px)
    const centerXWide = Math.max(0, (containerWidth - WIDGET_WIDTH_WIDE) / 2);
    const searchTop = WIDGET_TOP_MARGIN + WIDGET_CLOCK_WEATHER_HEIGHT + WIDGET_GAP;
    positions['widget-ai-search'] = {
        position: 'absolute',
        left: `${centerXWide}px`,
        top: `${searchTop}px`,
        width: wideWidthPx
    };

    // 4. AI回答パネル3つ (OpenAI, Anthropic, Gemini)
    const aiTop = searchTop + WIDGET_SEARCH_HEIGHT + WIDGET_GAP;
    if (containerWidth >= WIDGET_THREE_COLUMN_MIN_WIDTH) {
        const aiStartX = Math.max(0, (containerWidth - WIDGET_THREE_COLUMN_MIN_WIDTH) / 2);
        positions['widget-ai-openai'] = {
            position: 'absolute',
            left: `${aiStartX}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
        positions['widget-ai-anthropic'] = {
            position: 'absolute',
            left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
        positions['widget-ai-gemini'] = {
            position: 'absolute',
            left: `${aiStartX + ((WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP) * 2)}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
    } else if (containerWidth >= WIDGET_TWO_COLUMN_MIN_WIDTH) {
        // 2つ横並び + 1つ縦積み
        const aiTwoColumnWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_AI_PANEL_GAP;
        const aiStartX = Math.max(0, (containerWidth - aiTwoColumnWidth) / 2);
        positions['widget-ai-openai'] = {
            position: 'absolute',
            left: `${aiStartX}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
        positions['widget-ai-anthropic'] = {
            position: 'absolute',
            left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
        positions['widget-ai-gemini'] = {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
            width: normalWidthPx
        };
    } else {
        // すべて縦積み
        positions['widget-ai-openai'] = {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        };
        positions['widget-ai-anthropic'] = {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
            width: normalWidthPx
        };
        positions['widget-ai-gemini'] = {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2)}px`,
            width: normalWidthPx
        };
    }

    // 5. ToDo と クイックリンク (横並び)
    let nextTop = aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP;
    if (containerWidth < WIDGET_THREE_COLUMN_MIN_WIDTH && containerWidth >= WIDGET_TWO_COLUMN_MIN_WIDTH) {
        nextTop = aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2);
    } else if (containerWidth < WIDGET_TWO_COLUMN_MIN_WIDTH) {
        nextTop = aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 3);
    }

    const utilRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    const utilStartX = Math.max(0, (containerWidth - utilRowWidth) / 2);
    positions['widget-todo'] = {
        position: 'absolute',
        left: `${utilStartX}px`,
        top: `${nextTop}px`,
        width: normalWidthPx
    };
    positions['widget-quick-links'] = {
        position: 'absolute',
        left: `${utilStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        top: `${nextTop}px`,
        width: normalWidthPx
    };

    // 6. Discover (全幅 700px)
    const discoverTop = nextTop + WIDGET_UTILITY_HEIGHT + WIDGET_GAP;
    positions['widget-discover'] = {
        position: 'absolute',
        left: `${centerXWide}px`,
        top: `${discoverTop}px`,
        width: wideWidthPx
    };

    return positions;
}

// 状態の復元および自動配置
function restoreWidgetStates(container) {
    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
    const widgets = Array.from(container.querySelectorAll('.sortable-item'));
    const containerWidth = container.clientWidth || 1200;

    // デフォルト位置の計算
    const defaultPositions = calculateDefaultWidgetPositions(containerWidth);

    widgets.forEach((el) => {
        const id = el.getAttribute('data-id');
        const state = states[id];

        if (state && (state.left || state.top)) {
            // 保存された位置・サイズを復元
            el.style.position = state.pinned ? 'fixed' : 'absolute';
            el.style.left = state.left;
            el.style.top = state.top;
            if (state.width) el.style.width = state.width;
            if (state.height) el.style.height = state.height;
            if (state.pinned) {
                el.classList.add('widget-pinned');
            } else {
                el.classList.remove('widget-pinned');
            }
        } else {
            // 保存座標がない場合は、デフォルト配置を適用
            const def = defaultPositions[id];
            if (def) {
                el.style.position = def.position;
                el.style.left = def.left;
                el.style.top = def.top;
                el.style.width = def.width;
                if (def.pinned) {
                    el.classList.add('widget-pinned');
                } else {
                    el.classList.remove('widget-pinned');
                }
            }
        }

        addPinButton(el);
        makeElementDraggable(el, container);
    });
}

// ピン留めボタンの自動生成・制御
function addPinButton(el) {
    if (el.querySelector('.widget-pin-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'widget-pin-btn';
    btn.innerHTML = el.classList.contains('widget-pinned') ? '固定中' : '固定する';
    if (el.classList.contains('widget-pinned')) {
        btn.classList.add('active');
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPinned = el.classList.toggle('widget-pinned');

        if (isPinned) {
            btn.innerHTML = '固定中';
            btn.classList.add('active');

            // absoluteからfixedへ切り替え (ウィンドウ相対)
            const rect = el.getBoundingClientRect();
            el.style.position = 'fixed';
            el.style.left = `${rect.left}px`;
            el.style.top = `${rect.top}px`;
        } else {
            btn.innerHTML = '固定する';
            btn.classList.remove('active');

            // fixedからabsoluteへ切り替え (コンテナ相対)
            const rect = el.getBoundingClientRect();
            const containerRect = document.getElementById('dashboard-main').getBoundingClientRect();
            el.style.position = 'absolute';
            el.style.left = `${rect.left - containerRect.left}px`;
            el.style.top = `${rect.top - containerRect.top}px`;
        }

        saveWidgetState(el);
    });

    el.appendChild(btn);
}

// ウィジェットをドラッグ可能にする
function makeElementDraggable(el, container) {
    // 掴みやすくするため、ヘッダー領域またはウィジェット全体をドラッグ対象にする
    const handler = el.querySelector('.widget-header') || el.querySelector('.clock-widget') || el;

    handler.addEventListener('mousedown', (e) => {
        const editModeToggle = document.getElementById('toggle-edit-mode');
        if (!editModeToggle || !editModeToggle.checked) return;

        // 入力フォームやクリック可能な要素へのクリック時はドラッグをスキップ
        if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A', 'SPAN'].includes(e.target.tagName)) {
            if (e.target.classList.contains('widget-pin-btn')) return; // ピン留め自体は許可
            return;
        }

        // リサイズ領域（右下隅）のクリックかどうかをチェックして、リサイズ時はドラッグを開始しない
        const rect = el.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (clickX > rect.width - RESIZE_ZONE_PX && clickY > rect.height - RESIZE_ZONE_PX) {
            return; // リサイズ操作を優先
        }

        activeDragElement = el;
        e.preventDefault();

        const containerRect = container.getBoundingClientRect();

        if (el.classList.contains('widget-pinned')) {
            elementStartX = rect.left;
            elementStartY = rect.top;
        } else {
            elementStartX = rect.left - containerRect.left;
            elementStartY = rect.top - containerRect.top;
        }

        dragStartX = e.clientX;
        dragStartY = e.clientY;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function onMouseMove(e) {
    if (!activeDragElement) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    const newX = elementStartX + dx;
    const newY = elementStartY + dy;

    activeDragElement.style.left = `${newX}px`;
    activeDragElement.style.top = `${newY}px`;
}

function onMouseUp() {
    if (!activeDragElement) return;

    saveWidgetState(activeDragElement);

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    activeDragElement = null;
}

// ウィンドウリサイズ時の境界制御＆デフォルト配置ウィジェットの再計算
function handleWindowResize() {
    const container = document.getElementById('dashboard-main');
    if (!container) return;
    const containerWidth = container.clientWidth;

    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
    const defaultPositions = calculateDefaultWidgetPositions(containerWidth);

    container.querySelectorAll('.sortable-item').forEach(el => {
        const id = el.getAttribute('data-id');
        const state = states[id];

        // ユーザーがドラッグして位置が保存されている場合
        if (state && (state.left || state.top)) {
            if (el.classList.contains('widget-pinned')) return;

            const left = parseFloat(el.style.left) || 0;
            const width = el.clientWidth;

            if (left + width > containerWidth) {
                el.style.left = `${Math.max(0, containerWidth - width)}px`;
                saveWidgetState(el);
            }
        } else {
            // 位置が保存されていない（初期状態の）ウィジェットは、リサイズに合わせて再計算
            const def = defaultPositions[id];
            if (def) {
                el.style.position = def.position;
                el.style.left = def.left;
                el.style.top = def.top;
                el.style.width = def.width;
            }
        }
    });
}
