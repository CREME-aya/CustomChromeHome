(function() {
    let activeDragElement = null;
    let activeDragContainer = null;
    let activeDragCallbacks = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;

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

    function isResizeCornerClick(el, event) {
        const rect = el.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        return clickX > rect.width - RESIZE_ZONE_PX && clickY > rect.height - RESIZE_ZONE_PX;
    }

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

    function makeElementDraggable(el, container, callbacks) {
        el.addEventListener('mousedown', event => {
            const editModeToggle = document.getElementById('toggle-edit-mode');
            if (!editModeToggle || !editModeToggle.checked) return;
            if (shouldIgnoreDragStart(event.target)) return;
            if (isResizeCornerClick(el, event)) return;

            startDrag(el, container, event, callbacks);
        });
    }

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
