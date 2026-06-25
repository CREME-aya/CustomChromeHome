// Spotify 連携設定で共有する Redirect URI と直近エラーを管理する。
(function() {
const SPOTIFY_REDIRECT_PATH = 'spotify';
const SPOTIFY_AUTH_ERROR_KEY = 'spotify_auth_error';

window.SpotifyConfig = {
    clearAuthError,
    getLastAuthError,
    getRedirectUri,
    saveAuthError
};

function getRedirectUri() {
    if (typeof chrome === 'undefined' || !chrome.identity?.getRedirectURL) {
        return '';
    }

    return chrome.identity.getRedirectURL(SPOTIFY_REDIRECT_PATH);
}

function saveAuthError(message) {
    const errorRecord = {
        message: String(message || '不明なエラーが発生しました。'),
        occurredAt: new Date().toISOString()
    };
    localStorage.setItem(SPOTIFY_AUTH_ERROR_KEY, JSON.stringify(errorRecord));
    return errorRecord;
}

function getLastAuthError() {
    const storedValue = localStorage.getItem(SPOTIFY_AUTH_ERROR_KEY);
    if (!storedValue) return null;

    try {
        const errorRecord = JSON.parse(storedValue);
        if (!errorRecord?.message) return null;
        return errorRecord;
    } catch (error) {
        console.warn('Spotify の保存済みエラーを読み取れませんでした。', error);
        return null;
    }
}

function clearAuthError() {
    localStorage.removeItem(SPOTIFY_AUTH_ERROR_KEY);
}
})();
