// ==========================================
// localStorage JSON ヘルパー
// ==========================================

/**
 * localStorageからJSONデータを安全に読み込む
 * パースに失敗した場合はfallbackの値を返す
 *
 * @param {string} key - localStorageのキー
 * @param {any} fallback - 取得やパースに失敗した場合のデフォルト値
 * @returns {any} パースされたデータ、またはfallback値
 */
function readJsonFromStorage(key, fallback) {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (e) {
        // 壊れたJSONが保存されていても、画面全体を止めずに既定値へ戻す。
        return fallback;
    }
}

/**
 * データをJSON文字列化してlocalStorageに保存する
 *
 * @param {string} key - localStorageのキー
 * @param {any} value - 保存するデータ
 */
function writeJsonToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
