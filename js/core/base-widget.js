// ==========================================
// Widget lifecycle base class
// ==========================================
(function() {
/**
 * ウィジェットのライフサイクルを管理するベースクラス
 */
class BaseWidget {
    /**
     * @param {string} containerId - ウィジェットを描画するコンテナのID
     */
    constructor(containerId) {
        if (!containerId) {
            throw new Error('BaseWidget requires a containerId.');
        }

        this.containerId = containerId;
        this.boundListeners = [];
    }

    /**
     * コンテナ要素を取得する
     * @returns {HTMLElement|null} コンテナ要素
     */
    get container() {
        return document.getElementById(this.containerId);
    }

    /**
     * 初期化処理（サブクラスでオーバーライドする）
     */
    init() {}

    /**
     * 描画処理（サブクラスでオーバーライドする）
     */
    render() {}

    /**
     * ウィジェットを更新する
     * @returns {Promise<void>}
     */
    async refresh() {
        this.render();
    }

    /**
     * ウィジェットを破棄し、イベントリスナーを解除する
     */
    destroy() {
        this.boundListeners.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });
        this.boundListeners = [];
    }

    /**
     * イベントリスナーを登録する
     * @param {EventTarget} target - イベント対象
     * @param {string} type - イベントタイプ
     * @param {EventListenerOrEventListenerObject} listener - リスナー
     * @param {boolean|AddEventListenerOptions} [options] - オプション
     */
    bind(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== 'function') return;

        target.addEventListener(type, listener, options);
        this.boundListeners.push({ target, type, listener, options });
    }

    /**
     * ローディング状態を設定する
     * @param {string} message - メッセージ
     */
    setLoading(message) {
        window.ApiUI?.setLoading(this.containerId, message);
    }

    /**
     * エラー状態を設定する
     * @param {string} message - メッセージ
     */
    setError(message) {
        window.ApiUI?.setError(this.containerId, message);
    }

    /**
     * 空状態を設定する
     * @param {string} message - メッセージ
     */
    setEmpty(message) {
        window.ApiUI?.setEmpty(this.containerId, message);
    }

    /**
     * 認証ガイド状態を設定する
     * @param {string} message - メッセージ
     */
    setAuthGuide(message) {
        window.ApiUI?.setAuthGuide(this.containerId, message);
    }

    /**
     * カスタム状態を設定する
     * @param {string} message - メッセージ
     * @param {Object} [options={}] - オプション
     */
    setStatus(message, options = {}) {
        window.ApiUI?.setStatus(this.containerId, message, options);
    }

    /**
     * キャッシュを読み込む
     * @param {string} key - キャッシュキー
     * @param {*} fallback - フォールバック値
     * @returns {*} キャッシュ値
     */
    readCache(key, fallback) {
        return readJsonFromStorage(key, fallback);
    }

    /**
     * キャッシュを書き込む
     * @param {string} key - キャッシュキー
     * @param {*} value - キャッシュ値
     */
    writeCache(key, value) {
        writeJsonToStorage(key, value);
    }
}

window.BaseWidget = BaseWidget;
})();
