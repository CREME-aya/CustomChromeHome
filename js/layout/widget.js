(function() {
    /** @type {number|null} リサイズ処理のAnimationFrame ID */
    let resizeFrameId = null;

    /**
     * ウィジェットの並び替え・配置を初期化する
     */
    function initWidgetSortable() {
        const container = document.getElementById('dashboard-main');
        if (!container) return;

        restoreWidgetStates(container);
        bindEditMode(container);
        window.addEventListener('resize', scheduleWindowResize);
        scheduleWindowResize();
        bindResizeSave(container);
    }

    /**
     * 編集モード切替のイベントをバインドする
     * @param {Element} container コンテナ要素
     */
    function bindEditMode(container) {
        const editModeToggle = document.getElementById('toggle-edit-mode');
        if (!editModeToggle) return;

        const applyEditMode = () => {
            container.classList.toggle('layout-edit-active', editModeToggle.checked);
        };

        applyEditMode();
        editModeToggle.addEventListener('change', applyEditMode);
    }

    /**
     * リサイズ後の状態保存イベントをバインドする
     * @param {Element} container コンテナ要素
     */
    function bindResizeSave(container) {
        container.addEventListener('mouseup', event => {
            const editModeToggle = document.getElementById('toggle-edit-mode');
            if (!editModeToggle || !editModeToggle.checked) return;

            const item = event.target.closest('.sortable-item');
            if (!item) return;

            constrainWidgetToVisibleArea(item, container);
            saveWidgetState(item);
        });
    }

    /**
     * ウィジェットの現在の状態（位置、サイズなど）を保存する
     * @param {Element} el 保存対象のウィジェット要素
     */
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

    /**
     * 保存されているウィジェットの状態を復元して適用する
     * @param {Element} container コンテナ要素
     */
    function restoreWidgetStates(container) {
        const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
        const widgets = Array.from(container.querySelectorAll('.sortable-item'));
        const containerWidth = container.clientWidth || 1200;
        const defaultPositions = window.LayoutDefaults.calculateWidgetPositions(containerWidth);

        widgets.forEach(el => {
            const id = el.getAttribute('data-id');
            const state = states[id];

            if (state && (state.left || state.top)) {
                applySavedWidgetState(el, state);
            } else {
                applyDefaultWidgetState(el, defaultPositions[id]);
            }

            addPinButton(el);
            window.LayoutDrag.makeElementDraggable(el, container, {
                saveWidgetState,
                constrainWidgetToVisibleArea,
                getConstrainedWidgetPosition
            });
        });
    }

    /**
     * 保存された状態をウィジェット要素に適用する
     * @param {Element} el 対象のウィジェット要素
     * @param {Object} state 適用する状態
     */
    function applySavedWidgetState(el, state) {
        el.style.position = state.pinned ? 'fixed' : 'absolute';
        el.style.left = state.left;
        el.style.top = state.top;
        if (state.width) el.style.width = state.width;
        if (state.height) el.style.height = state.height;
        el.classList.toggle('widget-pinned', Boolean(state.pinned));
    }

    /**
     * デフォルトの状態をウィジェット要素に適用する
     * @param {Element} el 対象のウィジェット要素
     * @param {Object} defaultState デフォルト状態
     */
    function applyDefaultWidgetState(el, defaultState) {
        if (!defaultState) return;

        el.style.position = defaultState.position;
        el.style.left = defaultState.left;
        el.style.top = defaultState.top;
        el.style.width = defaultState.width;
        el.classList.toggle('widget-pinned', Boolean(defaultState.pinned));
    }

    /**
     * ウィジェットに固定ボタンを追加する
     * @param {Element} el 対象のウィジェット要素
     */
    function addPinButton(el) {
        if (el.querySelector('.widget-pin-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'widget-pin-btn';
        updatePinButton(btn, el.classList.contains('widget-pinned'));

        btn.addEventListener('click', event => {
            event.stopPropagation();

            const rect = el.getBoundingClientRect();
            const isPinned = el.classList.toggle('widget-pinned');
            updatePinButton(btn, isPinned);
            applyPinPosition(el, rect, isPinned);
            constrainWidgetToVisibleArea(el, document.getElementById('dashboard-main'));
            saveWidgetState(el);
        });

        el.appendChild(btn);
    }

    /**
     * 固定ボタンの表示状態を更新する
     * @param {Element} btn 固定ボタン要素
     * @param {boolean} isPinned 固定されているかどうか
     */
    function updatePinButton(btn, isPinned) {
        btn.innerHTML = isPinned ? '固定中' : '固定する';
        btn.classList.toggle('active', isPinned);
    }

    /**
     * 固定/解除時の位置を設定する
     * @param {Element} el 対象のウィジェット要素
     * @param {DOMRect} rect 要素の現在位置
     * @param {boolean} isPinned 固定されているかどうか
     */
    function applyPinPosition(el, rect, isPinned) {
        if (isPinned) {
            el.style.position = 'fixed';
            el.style.left = `${rect.left}px`;
            el.style.top = `${rect.top}px`;
            return;
        }

        const container = document.getElementById('dashboard-main');
        const containerRect = container.getBoundingClientRect();
        el.style.position = 'absolute';
        el.style.left = `${rect.left - containerRect.left + container.scrollLeft}px`;
        el.style.top = `${rect.top - containerRect.top + container.scrollTop}px`;
    }

    /**
     * リサイズ処理をスケジュールする
     */
    function scheduleWindowResize() {
        if (resizeFrameId !== null) return;

        resizeFrameId = window.requestAnimationFrame(() => {
            resizeFrameId = null;
            handleWindowResize();
        });
    }

    /**
     * 座標値をパースする
     * @param {string|number} value 解析する値
     * @param {number} fallback 失敗時のフォールバック値
     * @returns {number} 座標値
     */
    function parseCoordinate(value, fallback) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    /**
     * ウィジェットの寸法を解決する
     * @param {number} measuredValue 測定値
     * @param {string|number|null} savedValue 保存されている値
     * @param {string|number} inlineValue インラインスタイルの値
     * @param {number} fallbackValue フォールバック値
     * @returns {number} 解決された寸法
     */
    function resolveWidgetDimension(measuredValue, savedValue, inlineValue, fallbackValue) {
        const savedDimension = Number.parseFloat(savedValue);
        const inlineDimension = Number.parseFloat(inlineValue);

        if (measuredValue > 0) return measuredValue;
        if (Number.isFinite(savedDimension) && savedDimension > 0) return savedDimension;
        if (Number.isFinite(inlineDimension) && inlineDimension > 0) return inlineDimension;
        return fallbackValue;
    }

    /**
     * コンテナ内に収まるよう制限された座標を取得する
     * @param {Element} el 対象要素
     * @param {Element|null} container コンテナ要素
     * @param {number} left 提案されたX座標
     * @param {number} top 提案されたY座標
     * @returns {{left: number, top: number}} 制限された座標
     */
    function getConstrainedWidgetPosition(el, container, left, top) {
        if (!container) return { left, top };

        const isPinned = el.classList.contains('widget-pinned');
        const widgetRect = el.getBoundingClientRect();
        const boundaryWidth = isPinned
            ? (document.documentElement.clientWidth || window.innerWidth)
            : container.clientWidth;
        const widgetWidth = resolveWidgetDimension(widgetRect.width, null, el.style.width, WIDGET_WIDTH_NORMAL);
        const widgetHeight = resolveWidgetDimension(widgetRect.height, null, el.style.height, 0);
        const maxLeft = Math.max(0, boundaryWidth - widgetWidth);
        const maxTop = isPinned
            ? Math.max(0, (document.documentElement.clientHeight || window.innerHeight) - widgetHeight)
            : Number.POSITIVE_INFINITY;

        return {
            left: Math.min(Math.max(left, 0), maxLeft),
            top: Math.min(Math.max(top, 0), maxTop)
        };
    }

    /**
     * 要素が可視領域に収まるように位置を制限して適用する
     * @param {Element} el 対象要素
     * @param {Element} container コンテナ要素
     * @param {Object|null} [baseState=null] 基準となる状態
     */
    function constrainWidgetToVisibleArea(el, container, baseState = null) {
        const isPinned = el.classList.contains('widget-pinned');
        const containerRect = container.getBoundingClientRect();
        const widgetRect = el.getBoundingClientRect();
        const boundaryWidth = isPinned
            ? (document.documentElement.clientWidth || window.innerWidth)
            : container.clientWidth;
        const widgetWidth = resolveWidgetDimension(
            widgetRect.width,
            baseState?.width,
            el.style.width,
            WIDGET_WIDTH_NORMAL
        );
        const measuredLeft = isPinned ? widgetRect.left : widgetRect.left - containerRect.left + container.scrollLeft;
        const measuredTop = isPinned ? widgetRect.top : widgetRect.top - containerRect.top + container.scrollTop;
        const baseLeft = parseCoordinate(baseState?.left ?? el.style.left, measuredLeft);
        const baseTop = parseCoordinate(baseState?.top ?? el.style.top, measuredTop);
        const widgetHeight = resolveWidgetDimension(widgetRect.height, baseState?.height, el.style.height, 0);
        const maxLeft = Math.max(0, boundaryWidth - widgetWidth);
        const maxTop = isPinned
            ? Math.max(0, (document.documentElement.clientHeight || window.innerHeight) - widgetHeight)
            : Number.POSITIVE_INFINITY;

        el.style.left = `${Math.min(Math.max(baseLeft, 0), maxLeft)}px`;
        el.style.top = `${Math.min(Math.max(baseTop, 0), maxTop)}px`;
    }

    /**
     * ウィンドウリサイズ時の処理を実行する
     */
    function handleWindowResize() {
        const container = document.getElementById('dashboard-main');
        if (!container) return;

        const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
        const defaultPositions = window.LayoutDefaults.calculateWidgetPositions(container.clientWidth);

        container.querySelectorAll('.sortable-item').forEach(el => {
            const id = el.getAttribute('data-id');
            const state = states[id];

            if (state && (state.left || state.top)) {
                constrainWidgetToVisibleArea(el, container, state);
                return;
            }

            const defaultState = defaultPositions[id];
            if (!defaultState) return;

            applyDefaultWidgetState(el, defaultState);
            constrainWidgetToVisibleArea(el, container, defaultState);
        });
    }

    window.LayoutWidget = {
        initWidgetSortable,
        saveWidgetState,
        restoreWidgetStates,
        handleWindowResize,
        getConstrainedWidgetPosition,
        constrainWidgetToVisibleArea,
        resolveWidgetDimension,
        parseCoordinate
    };

    window.initWidgetSortable = initWidgetSortable;
})();
