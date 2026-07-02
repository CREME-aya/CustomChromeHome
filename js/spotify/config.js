// Spotify 連携設定で共有する Redirect URI と直近エラーを管理する。
(function() {
/** @constant {string} Spotifyのリダイレクト先パス */
const SPOTIFY_REDIRECT_PATH = 'spotify';
/** @constant {string} Spotify認証エラーの保存キー */
const SPOTIFY_AUTH_ERROR_KEY = 'spotify_auth_error';

window.SpotifyConfig = {
    clearAuthError,
    getLastAuthError,
    getRedirectUri,
    saveAuthError
};

/**
 * 拡張機能として読み込まれている場合、Spotify用のリダイレクトURIを取得する
 * @returns {string} リダイレクトURI。取得できない場合は空文字
 */
function getRedirectUri() {
    if (typeof chrome === 'undefined' || !chrome.identity?.getRedirectURL) {
        return '';
    }

    return chrome.identity.getRedirectURL(SPOTIFY_REDIRECT_PATH);
}

/**
 * 認証エラーのメッセージと発生日時を保存する
 * @param {string} message エラーメッセージ
 * @returns {Object} 保存されたエラー情報オブジェクト
 */
function saveAuthError(message) {
    const errorRecord = {
        message: String(message || '不明なエラーが発生しました。'),
        occurredAt: new Date().toISOString()
    };
    localStorage.setItem(SPOTIFY_AUTH_ERROR_KEY, JSON.stringify(errorRecord));
    return errorRecord;
}

/**
 * 保存されている直近の認証エラーを取得する
 * @returns {Object|null} エラー情報オブジェクト、または存在しない場合はnull
 */
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

/**
 * 保存されている認証エラーをクリアする
 */
function clearAuthError() {
    localStorage.removeItem(SPOTIFY_AUTH_ERROR_KEY);
}
})();
