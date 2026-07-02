(function() {
    /** @type {Element|null} ドラッグ中の要素 */
    let activeDragElement = null;
    /** @type {Element|null} ドラッグ領域のコンテナ */
    let activeDragContainer = null;
    /** @type {Object|null} ドラッグ中のコールバック関数群 */
    let activeDragCallbacks = null;
    /** @type {number} ドラッグ開始時のマウスX座標 */
    let dragStartX = 0;
    /** @type {number} ドラッグ開始時のマウスY座標 */
    let dragStartY = 0;
    /** @type {number} 要素の初期X座標 */
    let elementStartX = 0;
    /** @type {number} 要素の初期Y座標 */
    let elementStartY = 0;

    /**
     * ドラッグ開始を無視すべき要素かどうかを判定する
     * @param {EventTarget} target イベントターゲット
     * @returns {boolean} 無視すべき場合はtrue
     */
    function shouldIgnoreDragStart(target) {
        if (!(target instanceof Element)) return true;

        const interactiveSelector = [
            'input',
            'textarea',
            'button',
            'select',
            'a',
            '[role="button"]',
            '[contenteditable="true"]',
            '.widget-pin-btn'
        ].join(',');

        return Boolean(target.closest(interactiveSelector));
    }

    /**
     * リサイズ用コーナー領域がクリックされたか判定する
     * @param {Element} el 対象要素
     * @param {MouseEvent} event マウスイベント
     * @returns {boolean} リサイズコーナーの場合はtrue
     */
    function isResizeCornerClick(el, event) {
        const rect = el.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        return clickX > rect.width - RESIZE_ZONE_PX && clickY > rect.height - RESIZE_ZONE_PX;
    }

    /**
     * 要素の現在位置（ドラッグ開始位置）を計算して取得する
     * @param {Element} el 対象要素
     * @param {Element} container コンテナ要素
     * @returns {{left: number, top: number}} 座標オブジェクト
     */
    function getElementStartPosition(el, container) {
        const rect = el.getBoundingClientRect();

        if (el.classList.contains('widget-pinned')) {
            return { left: rect.left, top: rect.top };
        }

        const containerRect = container.getBoundingClientRect();
        return {
            left: rect.left - containerRect.left + container.scrollLeft,
            top: rect.top - containerRect.top + container.scrollTop
        };
    }

    /**
     * ドラッグ処理を開始する
     * @param {Element} el ドラッグ対象要素
     * @param {Element} container コンテナ要素
     * @param {MouseEvent} event マウスイベント
     * @param {Object} callbacks コールバック関数群
     */
    function startDrag(el, container, event, callbacks) {
        activeDragElement = el;
        activeDragContainer = container;
        activeDragCallbacks = callbacks;

        const startPosition = getElementStartPosition(el, container);
        elementStartX = startPosition.left;
        elementStartY = startPosition.top;
        dragStartX = event.clientX;
        dragStartY = event.clientY;

        event.preventDefault();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * 要素をドラッグ可能に設定する
     * @param {Element} el ドラッグ対象要素
     * @param {Element} container コンテナ要素
     * @param {Object} callbacks コールバック関数群
     */
    function makeElementDraggable(el, container, callbacks) {
        el.addEventListener('mousedown', event => {
            const editModeToggle = document.getElementById('toggle-edit-mode');
            if (!editModeToggle || !editModeToggle.checked) return;
            if (shouldIgnoreDragStart(event.target)) return;
            if (isResizeCornerClick(el, event)) return;

            startDrag(el, container, event, callbacks);
        });
    }

    /**
     * マウス移動時のドラッグ処理
     * @param {MouseEvent} event マウスイベント
     */
    function onMouseMove(event) {
        if (!activeDragElement) return;

        const proposedX = elementStartX + (event.clientX - dragStartX);
        const proposedY = elementStartY + (event.clientY - dragStartY);
        const nextPosition = activeDragCallbacks.getConstrainedWidgetPosition(
            activeDragElement,
            activeDragContainer,
            proposedX,
            proposedY
        );

        activeDragElement.style.left = `${nextPosition.left}px`;
        activeDragElement.style.top = `${nextPosition.top}px`;
    }

    /**
     * ドラッグ終了時の処理
     */
    function onMouseUp() {
        if (!activeDragElement) return;

        const container = document.getElementById('dashboard-main');
        if (container) {
            activeDragCallbacks.constrainWidgetToVisibleArea(activeDragElement, container);
        }

        activeDragCallbacks.saveWidgetState(activeDragElement);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        activeDragElement = null;
        activeDragContainer = null;
        activeDragCallbacks = null;
    }

    window.LayoutDrag = {
        makeElementDraggable,
        shouldIgnoreDragStart,
        onMouseMove,
        onMouseUp
    };
})();
