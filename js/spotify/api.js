// ==========================================
// Spotify Web API クライアント
// ==========================================
(function() {
window.SpotifyApi = {
    control,
    getCurrentPlayback
};

async function getCurrentPlayback() {
    return fetchWithAuth('https://api.spotify.com/v1/me/player');
}

async function control(action, method = 'PUT') {
    return fetchWithAuth(`https://api.spotify.com/v1/me/player/${action}`, { method: method });
}

async function fetchWithAuth(url, options = {}, shouldRetry = true) {
    const token = await window.SpotifyAuth.getValidAccessToken();
    if (!token) return null;

    // すべてのSpotify API呼び出しに、現在有効なアクセストークンを付与する。
    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status !== 401 || !shouldRetry) {
        return res;
    }

    // トークン期限切れの可能性がある場合だけ更新して1回だけ再試行する。
    const refreshedToken = await window.SpotifyAuth.refreshAccessToken();
    if (!refreshedToken) {
        return res;
    }
    return fetchWithAuth(url, options, false);
}
})();
