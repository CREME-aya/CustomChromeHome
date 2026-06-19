// ==========================================
// Spotify 機能
// ==========================================
const SPOTIFY_CLIENT_ID = '3ed94377fd3840f2b3f3e88967a2ed78';
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
const SPOTIFY_REDIRECT_PATH = 'spotify';

let spotifyPollInterval = null;

async function initSpotify() {
    const loginBtn = document.getElementById('spotify-login-btn');
    const logoutBtn = document.getElementById('spotify-logout-btn');
    if(!loginBtn) return;

    if (hasStoredSpotifySession()) {
        showSpotifyPlayer(true);
        try {
            await getValidSpotifyAccessToken();
            startSpotifyPolling();
        } catch(e) {
            console.error("Spotify session restore error:", e);
            logoutSpotify();
        }
    } else {
        showSpotifyPlayer(false);
    }

    loginBtn.addEventListener('click', authenticateSpotify);
    logoutBtn.addEventListener('click', logoutSpotify);

    document.getElementById('spotify-play-btn').addEventListener('click', toggleSpotifyPlay);
    document.getElementById('spotify-next-btn').addEventListener('click', () => controlSpotify('next', 'POST'));
    document.getElementById('spotify-prev-btn').addEventListener('click', () => controlSpotify('previous', 'POST'));
}

// ==========================================
// Spotify API / PKCE Auth Helpers
// ==========================================
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function authenticateSpotify() {
    // chrome.identity.launchWebAuthFlow が使える環境（Chrome拡張）かチェック
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        alert("Chrome拡張機能として動作していないか、manifest.jsonにidentity権限がありません。");
        return;
    }

    const redirectUri = getSpotifyRedirectUri();
    console.log("Spotify Redirect URI:", redirectUri);

    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    const authParams = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: SPOTIFY_SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
        show_dialog: 'true'
    });
    const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
    console.log("Spotify Auth URL:", authUrl);

    try {
        const redirectUrl = await launchSpotifyAuthFlow(authUrl, redirectUri);
        const urlObj = new URL(redirectUrl);
        const error = urlObj.searchParams.get('error');
        if (error) {
            alert(`Spotifyの認証に失敗しました。\n理由: ${error}`);
            return;
        }

        if (urlObj.searchParams.get('state') !== state) {
            alert("Spotifyの認証応答を検証できませんでした。もう一度連携してください。");
            return;
        }

        const code = urlObj.searchParams.get('code');
        if (!code) {
            alert("認証コードが取得できませんでした。");
            return;
        }

        try {
            const tokenData = await requestSpotifyToken({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            });

            if (tokenData.access_token) {
                saveSpotifyToken(tokenData);
                showSpotifyPlayer(true);
                startSpotifyPolling();
            }
        } catch(e) {
            console.error(e);
            alert(`Spotifyトークンの取得に失敗しました。\n${e.message}`);
        }
    } catch(e) {
        console.error("Auth Error:", e);
        alert(`Spotifyの認証ページを開けませんでした。\n詳細: ${e.message}\n\nSpotify Developer Dashboard に次の Redirect URI が登録されているか確認してください。\n${redirectUri}`);
    }
}

function logoutSpotify() {
    clearSpotifyToken();
    stopSpotifyPolling();
    showSpotifyPlayer(false);
}

function showSpotifyPlayer(isLoggedIn) {
    document.getElementById('spotify-login-btn').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-logout-btn').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('spotify-auth-prompt').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-player-container').style.display = isLoggedIn ? 'flex' : 'none';
}

function startSpotifyPolling() {
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    fetchSpotifyCurrentlyPlaying();
    spotifyPollInterval = setInterval(fetchSpotifyCurrentlyPlaying, 5000);
}

function stopSpotifyPolling() {
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    spotifyPollInterval = null;
}

async function fetchSpotifyCurrentlyPlaying() {
    try {
        const res = await fetchSpotifyWithAuth('https://api.spotify.com/v1/me/player');
        if (!res) return;

        if (res.status === 401) {
            logoutSpotify();
            return;
        }

        if (res.status === 204 || res.status === 202) {
            // 再生されていない
            updateSpotifyUI(null);
            return;
        }

        const data = await res.json();
        updateSpotifyUI(data);
    } catch(e) {
        console.error("Spotify Fetch Error:", e);
    }
}

function updateSpotifyUI(data) {
    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    const artEl = document.getElementById('spotify-art');
    const playBtn = document.getElementById('spotify-play-btn');

    if (!data || !data.item) {
        trackEl.textContent = 'デバイスで再生されていません';
        artistEl.textContent = '-';
        artEl.src = '';
        playBtn.textContent = '▶️';
        return;
    }

    trackEl.textContent = data.item.name;
    artistEl.textContent = data.item.artists.map(a => a.name).join(', ');
    if (data.item.album && data.item.album.images.length > 0) {
        artEl.src = data.item.album.images[0].url;
    }

    if (data.is_playing) {
        playBtn.textContent = '⏸';
    } else {
        playBtn.textContent = '▶️';
    }
}

async function controlSpotify(action, method = 'PUT') {
    try {
        const res = await fetchSpotifyWithAuth(`https://api.spotify.com/v1/me/player/${action}`, { method: method });
        if (!res) return;

        if (res.status === 401) {
            logoutSpotify();
            return;
        }
        setTimeout(fetchSpotifyCurrentlyPlaying, 500); // すぐに状態を更新
    } catch(e) {
        console.error(e);
    }
}

async function toggleSpotifyPlay() {
    const playBtn = document.getElementById('spotify-play-btn');
    const isPlaying = playBtn.textContent === '⏸';
    await controlSpotify(isPlaying ? 'pause' : 'play', 'PUT');
}

function getSpotifyRedirectUri() {
    return chrome.identity.getRedirectURL(SPOTIFY_REDIRECT_PATH);
}

async function launchSpotifyAuthFlow(authUrl, redirectUri) {
    try {
        return await launchSpotifyAuthFlowWithIdentity(authUrl);
    } catch(e) {
        console.warn("chrome.identity.launchWebAuthFlow failed. Falling back to a normal tab.", e);
        return launchSpotifyAuthFlowInTab(authUrl, redirectUri);
    }
}

function launchSpotifyAuthFlowWithIdentity(authUrl) {
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                reject(new Error(chrome.runtime.lastError?.message || '認証応答がありません。'));
                return;
            }
            resolve(redirectUrl);
        });
    });
}

function launchSpotifyAuthFlowInTab(authUrl, redirectUri) {
    if (!chrome.tabs?.create || !chrome.tabs?.onUpdated) {
        throw new Error('通常タブで認証を開くための chrome.tabs API が利用できません。');
    }

    return new Promise((resolve, reject) => {
        let authTabId = null;
        let timeoutId = null;

        const cleanup = () => {
            chrome.tabs.onUpdated.removeListener(handleUpdated);
            chrome.tabs.onRemoved.removeListener(handleRemoved);
            if (timeoutId) clearTimeout(timeoutId);
        };

        const finish = (redirectUrl) => {
            cleanup();
            if (authTabId !== null) {
                chrome.tabs.remove(authTabId, () => void chrome.runtime.lastError);
            }
            resolve(redirectUrl);
        };

        const handleUpdated = (tabId, changeInfo) => {
            if (tabId !== authTabId || !changeInfo.url) return;
            if (changeInfo.url.startsWith(redirectUri)) {
                finish(changeInfo.url);
            }
        };

        const handleRemoved = (tabId) => {
            if (tabId !== authTabId) return;
            cleanup();
            reject(new Error('認証タブが閉じられました。'));
        };

        chrome.tabs.onUpdated.addListener(handleUpdated);
        chrome.tabs.onRemoved.addListener(handleRemoved);

        chrome.tabs.create({ url: authUrl, active: true }, (tab) => {
            if (chrome.runtime.lastError || !tab?.id) {
                cleanup();
                reject(new Error(chrome.runtime.lastError?.message || '認証タブを作成できませんでした。'));
                return;
            }
            authTabId = tab.id;
        });

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Spotify 認証がタイムアウトしました。'));
        }, 120000);
    });
}

async function requestSpotifyToken(params) {
    const body = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        ...params
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    const data = await parseSpotifyTokenResponse(res);
    if (!res.ok) {
        const message = data.error_description || data.error || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return data;
}

async function parseSpotifyTokenResponse(res) {
    try {
        return await res.json();
    } catch(e) {
        return {};
    }
}

async function fetchSpotifyWithAuth(url, options = {}, shouldRetry = true) {
    const token = await getValidSpotifyAccessToken();
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

    const refreshedToken = await refreshSpotifyAccessToken();
    if (!refreshedToken) {
        return res;
    }
    return fetchSpotifyWithAuth(url, options, false);
}

function saveSpotifyToken(data) {
    if (data.access_token) {
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.accessToken, data.access_token);
    }
    if (data.refresh_token) {
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.refreshToken, data.refresh_token);
    }
    if (data.expires_in) {
        const expiresAt = Date.now() + (Number(data.expires_in) * 1000);
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.expiresAt, String(expiresAt));
    }
}

function clearSpotifyToken() {
    Object.values(SPOTIFY_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

function hasStoredSpotifySession() {
    return Boolean(
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken) ||
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken)
    );
}

async function getValidSpotifyAccessToken() {
    const token = localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken);
    const isTokenExpiring = isSpotifyTokenExpiring();
    if (token && !isTokenExpiring) {
        return token;
    }

    const refreshedToken = await refreshSpotifyAccessToken();
    if (refreshedToken) {
        return refreshedToken;
    }
    return isTokenExpiring ? null : token;
}

async function refreshSpotifyAccessToken() {
    const refreshToken = localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
        return null;
    }

    try {
        const tokenData = await requestSpotifyToken({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        saveSpotifyToken(tokenData);
        return tokenData.access_token || null;
    } catch(e) {
        console.error("Spotify token refresh error:", e);
        logoutSpotify();
        return null;
    }
}

function isSpotifyTokenExpiring() {
    const expiresAt = Number(localStorage.getItem(SPOTIFY_STORAGE_KEYS.expiresAt) || '0');
    if (!expiresAt) return false;
    return Date.now() + SPOTIFY_TOKEN_REFRESH_MARGIN_MS >= expiresAt;
}
