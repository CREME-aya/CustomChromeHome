// ==========================================
// localStorage JSON ヘルパー
// ==========================================
function readJsonFromStorage(key, fallback) {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (e) {
        // 壊れたJSONが保存されていても、画面全体を止めずに既定値へ戻す。
        return fallback;
    }
}

function writeJsonToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
