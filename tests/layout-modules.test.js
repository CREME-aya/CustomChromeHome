global.window = global;

const storage = new Map();
let failed = 0;
const tests = [];

class ClassListStub {
    constructor(initial = []) {
        this.values = new Set(initial);
    }

    add(value) {
        this.values.add(value);
    }

    remove(value) {
        this.values.delete(value);
    }

    contains(value) {
        return this.values.has(value);
    }

    toggle(value, force) {
        if (typeof force === 'boolean') {
            force ? this.add(value) : this.remove(value);
            return force;
        }

        if (this.contains(value)) {
            this.remove(value);
            return false;
        }

        this.add(value);
        return true;
    }
}

class ElementStub {
    constructor({ id = '', tagName = 'div', classes = [], rect = {} } = {}) {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.classList = new ClassListStub(classes);
        this.style = {};
        this.attributes = new Map();
        this.children = [];
        this.listeners = new Map();
        this.parentNode = null;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.clientWidth = 1200;
        this.clientHeight = 800;
        this.rect = {
            left: 0,
            top: 0,
            width: 320,
            height: 240,
            ...rect
        };
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) || '';
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
    }

    querySelector() {
        return null;
    }

    querySelectorAll(selector) {
        if (selector !== '.sortable-item') return [];
        return this.children.filter(child => child.classList.contains('sortable-item'));
    }

    closest(selector) {
        const selectors = selector.split(',');
        if (selectors.includes(this.tagName.toLowerCase())) return this;
        if (selectors.includes('.widget-pin-btn') && this.classList.contains('widget-pin-btn')) return this;
        if (selectors.includes('[role="button"]') && this.getAttribute('role') === 'button') return this;
        if (selectors.includes('[contenteditable="true"]') && this.getAttribute('contenteditable') === 'true') return this;
        if (selector === '.sortable-item' && this.classList.contains('sortable-item')) return this;
        return this.parentNode?.closest?.(selector) || null;
    }

    getBoundingClientRect() {
        return this.rect;
    }
}

global.Element = ElementStub;
global.document = {
    documentElement: { clientWidth: 800, clientHeight: 600 },
    getElementById: () => null,
    createElement: () => new ElementStub({ tagName: 'button' }),
    addEventListener: () => {},
    removeEventListener: () => {}
};
global.localStorage = {
    getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
        storage.set(key, String(value));
    }
};
global.readJsonFromStorage = (key, fallback) => {
    const value = global.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
};
global.writeJsonToStorage = (key, value) => {
    global.localStorage.setItem(key, JSON.stringify(value));
};
global.STORAGE_KEY_WIDGET_STATES = 'widget_states';
global.WIDGET_WIDTH_NORMAL = 320;
global.RESIZE_ZONE_PX = 16;
global.LayoutDefaults = {
    calculateWidgetPositions: () => ({
        weather: {
            position: 'absolute',
            left: '24px',
            top: '48px',
            width: '320px',
            pinned: false
        }
    })
};
global.requestAnimationFrame = callback => {
    callback();
    return 1;
};
global.addEventListener = () => {};

require('../js/layout/drag.js');
require('../js/layout/widget.js');
require('../js/layout.js');

function test(name, callback) {
    tests.push({ name, callback });
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('LayoutDrag.shouldIgnoreDragStart は入力やボタンだけをドラッグ対象外にする', () => {
    assertEqual(window.LayoutDrag.shouldIgnoreDragStart(new ElementStub({ tagName: 'button' })), true);
    assertEqual(window.LayoutDrag.shouldIgnoreDragStart(new ElementStub({ classes: ['widget-pin-btn'] })), true);
    assertEqual(window.LayoutDrag.shouldIgnoreDragStart(new ElementStub({ tagName: 'span' })), false);
});

test('LayoutWidget.saveWidgetState は位置・サイズ・固定状態を保存する', () => {
    const widget = new ElementStub({ classes: ['sortable-item', 'widget-pinned'] });
    widget.setAttribute('data-id', 'weather');
    widget.style.left = '12px';
    widget.style.top = '24px';
    widget.style.width = '320px';
    widget.style.height = '240px';

    window.LayoutWidget.saveWidgetState(widget);

    const saved = JSON.parse(storage.get(global.STORAGE_KEY_WIDGET_STATES));
    assertEqual(saved.weather.left, '12px');
    assertEqual(saved.weather.top, '24px');
    assertEqual(saved.weather.width, '320px');
    assertEqual(saved.weather.height, '240px');
    assertEqual(saved.weather.pinned, true);
});

test('LayoutWidget.getConstrainedWidgetPosition は通常配置をコンテナ幅へ収める', () => {
    const container = new ElementStub();
    container.clientWidth = 500;
    const widget = new ElementStub({ rect: { width: 320, height: 120 } });
    const position = window.LayoutWidget.getConstrainedWidgetPosition(widget, container, 300, -20);

    assertEqual(position.left, 180);
    assertEqual(position.top, 0);
});

test('LayoutWidget.constrainWidgetToVisibleArea は保存済み基準座標から表示座標だけを補正する', () => {
    const container = new ElementStub({ rect: { left: 0, top: 0, width: 500, height: 800 } });
    container.clientWidth = 500;
    const widget = new ElementStub({ rect: { left: 0, top: 0, width: 320, height: 120 } });
    widget.style.width = '320px';

    window.LayoutWidget.constrainWidgetToVisibleArea(widget, container, {
        left: '1000px',
        top: '-30px',
        width: '320px'
    });

    assertEqual(widget.style.left, '180px');
    assertEqual(widget.style.top, '0px');
});

test('layout facade は initWidgetSortable の公開契約を維持する', () => {
    assertEqual(window.initWidgetSortable, window.LayoutWidget.initWidgetSortable);
});

for (const { name, callback } of tests) {
    try {
        callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

if (failed > 0) process.exit(1);
