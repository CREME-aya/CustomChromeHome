// ==========================================
// Spotify auth and token storage
// ==========================================
(function() {
const SPOTIFY_CLIENT_ID = '3ed94377fd3840f2b3f3e88967a2ed78';
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
const SPOTIFY_REDIRECT_PATH = 'spotify';

window.SpotifyAuth = {
    authenticate,
    clearToken,
    getValidAccessToken,
    hasStoredSession,
    refreshAccessToken
};

async function authenticate() {
    // chrome.identity.launchWebAuthFlow が使える環境（Chrome拡張）かチェック
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        window.showNotification("Chrome拡張機能として動作していないか、identity権限がありません。", 'error');
        return false;
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
            window.showNotification(`Spotifyの認証に失敗しました。理由: ${error}`, 'error');
            return false;
        }

        if (urlObj.searchParams.get('state') !== state) {
            window.showNotification("Spotifyの認証応答を検証できませんでした。もう一度連携してください。", 'error');
            return false;
        }

        const code = urlObj.searchParams.get('code');
        if (!code) {
            window.showNotification("認証コードが取得できませんでした。", 'error');
            return false;
        }

        try {
            const tokenData = await requestToken({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            });

            if (tokenData.access_token) {
                saveToken(tokenData);
                return true;
            }
            return false;
        } catch(e) {
            console.error(e);
            window.showNotification(`Spotifyトークンの取得に失敗しました。${e.message}`, 'error');
            return false;
        }
    } catch(e) {
        console.error("Auth Error:", e);
        window.showNotification(`Spotifyの認証ページを開けませんでした。Redirect URI を確認してください。詳細: ${e.message}`, 'error', { durationMs: 7000 });
        return false;
    }
}

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

async function requestToken(params) {
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

    const data = await parseTokenResponse(res);
    if (!res.ok) {
        const message = data.error_description || data.error || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return data;
}

async function parseTokenResponse(res) {
    try {
        return await res.json();
    } catch(e) {
        return {};
    }
}

function saveToken(data) {
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

function clearToken() {
    Object.values(SPOTIFY_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

function hasStoredSession() {
    return Boolean(
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken) ||
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken)
    );
}

async function getValidAccessToken() {
    const token = localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken);
    const isTokenExpiring = isTokenExpiringSoon();
    if (token && !isTokenExpiring) {
        return token;
    }

    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
        return refreshedToken;
    }
    return isTokenExpiring ? null : token;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
        return null;
    }

    try {
        const tokenData = await requestToken({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        saveToken(tokenData);
        return tokenData.access_token || null;
    } catch(e) {
        console.error("Spotify token refresh error:", e);
        clearToken();
        return null;
    }
}

function isTokenExpiringSoon() {
    const expiresAt = Number(localStorage.getItem(SPOTIFY_STORAGE_KEYS.expiresAt) || '0');
    if (!expiresAt) return false;
    return Date.now() + SPOTIFY_TOKEN_REFRESH_MARGIN_MS >= expiresAt;
}
})();
