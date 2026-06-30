// ==========================================
// Widget lifecycle base class
// ==========================================
(function() {
class BaseWidget {
    constructor(containerId) {
        if (!containerId) {
            throw new Error('BaseWidget requires a containerId.');
        }

        this.containerId = containerId;
        this.boundListeners = [];
    }

    get container() {
        return document.getElementById(this.containerId);
    }

    init() {}

    render() {}

    async refresh() {
        this.render();
    }

    destroy() {
        this.boundListeners.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });
        this.boundListeners = [];
    }

    bind(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== 'function') return;

        target.addEventListener(type, listener, options);
        this.boundListeners.push({ target, type, listener, options });
    }

    setLoading(message) {
        window.ApiUI?.setLoading(this.containerId, message);
    }

    setError(message) {
        window.ApiUI?.setError(this.containerId, message);
    }

    setEmpty(message) {
        window.ApiUI?.setEmpty(this.containerId, message);
    }

    setAuthGuide(message) {
        window.ApiUI?.setAuthGuide(this.containerId, message);
    }

    setStatus(message, options = {}) {
        window.ApiUI?.setStatus(this.containerId, message, options);
    }

    readCache(key, fallback) {
        return readJsonFromStorage(key, fallback);
    }

    writeCache(key, value) {
        writeJsonToStorage(key, value);
    }
}

window.BaseWidget = BaseWidget;
})();
