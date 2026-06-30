const fs = require('fs');
const vm = require('vm');

let failed = 0;
const calls = [];
const listeners = [];
const storage = {};

function test(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

global.window = global;
global.document = {
    getElementById(id) {
        return { id };
    }
};
global.localStorage = {
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
    },
    setItem(key, value) {
        storage[key] = String(value);
    }
};
global.ApiUI = {
    setLoading(containerId, message) {
        calls.push(['loading', containerId, message]);
    },
    setError(containerId, message) {
        calls.push(['error', containerId, message]);
    },
    setEmpty(containerId, message) {
        calls.push(['empty', containerId, message]);
    },
    setAuthGuide(containerId, message) {
        calls.push(['auth', containerId, message]);
    },
    setStatus(containerId, message, options) {
        calls.push(['status', containerId, message, options]);
    }
};

vm.runInThisContext(fs.readFileSync('js/storage.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/core/base-widget.js', 'utf8'));

test('BaseWidget exposes common UI helpers for its container', () => {
    const widget = new window.BaseWidget('target-widget');

    widget.setLoading('読み込み中');
    widget.setError('失敗');
    widget.setStatus('完了', { type: 'success', baseClass: 'widget-status' });

    assert(calls[0][0] === 'loading' && calls[0][1] === 'target-widget', 'setLoading が containerId を渡していません');
    assert(calls[1][0] === 'error' && calls[1][2] === '失敗', 'setError が message を渡していません');
    assert(calls[2][0] === 'status' && calls[2][3].type === 'success', 'setStatus が options を渡していません');
});

test('BaseWidget reads and writes JSON cache through storage helpers', () => {
    const widget = new window.BaseWidget('target-widget');

    widget.writeCache('base_widget_cache', { ok: true });
    assert(widget.readCache('base_widget_cache', null).ok === true, 'cache を JSON として復元できません');
    assert(widget.readCache('missing_cache', { fallback: true }).fallback === true, 'fallback が返りません');
});

test('BaseWidget tracks bound listeners and removes them on destroy', () => {
    const widget = new window.BaseWidget('target-widget');
    const target = {
        addEventListener(type, listener, options) {
            listeners.push(['add', type, listener, options]);
        },
        removeEventListener(type, listener, options) {
            listeners.push(['remove', type, listener, options]);
        }
    };
    const listener = () => {};

    widget.bind(target, 'click', listener, { once: true });
    widget.destroy();

    assert(listeners[0][0] === 'add' && listeners[1][0] === 'remove', 'listener が解除されていません');
    assert(widget.boundListeners.length === 0, 'listener 管理配列が空になっていません');
});

if (failed > 0) process.exit(1);
