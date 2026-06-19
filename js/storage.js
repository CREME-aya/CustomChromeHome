function readJsonFromStorage(key, fallback) {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeJsonToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
