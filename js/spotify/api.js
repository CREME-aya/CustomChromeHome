// ==========================================
// Spotify Web API
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

    const refreshedToken = await window.SpotifyAuth.refreshAccessToken();
    if (!refreshedToken) {
        return res;
    }
    return fetchWithAuth(url, options, false);
}
})();
