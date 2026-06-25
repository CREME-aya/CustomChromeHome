// ==========================================
// Google OAuth 2.0 認証とトークン管理
// ==========================================
(function() {
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.readonly';

window.GoogleAuth = {
    initSettings,
    authenticate,
    clearToken,
    getValidAccessToken,
    hasStoredSession,
    refreshAccessToken,
    getRedirectUri
};

function getRedirectUri() {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL) {
        return chrome.identity.getRedirectURL('google');
    }
    const extId = typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : 'dummy';
    return `https://${extId}.chromiumapp.org/google`;
}

async function authenticate() {
    const clientId = localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID);
    if (!clientId) {
        notifyAuthError("Google Client ID が設定されていません。設定サイドバーから入力してください。");
        return false;
    }

    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        notifyAuthError("Chrome拡張機能として動作していないか、identity権限がありません。");
        return false;
    }

    const redirectUri = getRedirectUri();
    console.log("Google Redirect URI:", redirectUri);

    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: GOOGLE_SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
        access_type: 'offline',
        prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
    console.log("Google Auth URL:", authUrl);

    try {
        const redirectUrl = await launchGoogleAuthFlow(authUrl, redirectUri);
        const urlObj = new URL(redirectUrl);
        
        let code = urlObj.searchParams.get('code');
        let respState = urlObj.searchParams.get('state');
        
        if (!code && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            code = hashParams.get('code');
            respState = hashParams.get('state');
        }

        const error = urlObj.searchParams.get('error');
        if (error) {
            notifyAuthError(`Googleの認証に失敗しました。理由: ${error}`);
            return false;
        }

        if (respState !== state) {
            notifyAuthError("Googleの認証応答を検証できませんでした。セキュリティ状態が一致しません。");
            return false;
        }

        if (!code) {
            notifyAuthError("認証コードが取得できませんでした。");
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
                window.showNotification("Google 連携に成功しました！", "success");
                return true;
            }
            return false;
        } catch(e) {
            console.error(e);
            notifyAuthError(`Googleトークンの取得に失敗しました。詳細: ${e.message}`);
            return false;
        }
    } catch(e) {
        console.error("Auth Error:", e);
        notifyAuthError(`Googleの認証ページを開けませんでした。詳細: ${e.message}`, { durationMs: 7000 });
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

async function launchGoogleAuthFlow(authUrl, redirectUri) {
    try {
        return await launchGoogleAuthFlowWithIdentity(authUrl);
    } catch(e) {
        console.warn("chrome.identity.launchWebAuthFlow failed. Falling back to a normal tab.", e);
        return launchGoogleAuthFlowInTab(authUrl, redirectUri);
    }
}

function launchGoogleAuthFlowWithIdentity(authUrl) {
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

function launchGoogleAuthFlowInTab(authUrl, redirectUri) {
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
            reject(new Error('Google 認証がタイムアウトしました。'));
        }, 120000);
    });
}

async function requestToken(params) {
    const clientId = localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID);
    const body = new URLSearchParams({
        client_id: clientId,
        ...params
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
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
        localStorage.setItem(GOOGLE_STORAGE_KEYS.accessToken, data.access_token);
    }
    if (data.refresh_token) {
        localStorage.setItem(GOOGLE_STORAGE_KEYS.refreshToken, data.refresh_token);
    }
    if (data.expires_in) {
        const expiresAt = Date.now() + (Number(data.expires_in) * 1000);
        localStorage.setItem(GOOGLE_STORAGE_KEYS.expiresAt, String(expiresAt));
    }
}

function clearToken() {
    Object.values(GOOGLE_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

function hasStoredSession() {
    return Boolean(
        localStorage.getItem(GOOGLE_STORAGE_KEYS.accessToken) ||
        localStorage.getItem(GOOGLE_STORAGE_KEYS.refreshToken)
    );
}

async function getValidAccessToken() {
    const token = localStorage.getItem(GOOGLE_STORAGE_KEYS.accessToken);
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
    const refreshToken = localStorage.getItem(GOOGLE_STORAGE_KEYS.refreshToken);
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
        console.error("Google token refresh error:", e);
        clearToken();
        return null;
    }
}

function isTokenExpiringSoon() {
    const expiresAt = Number(localStorage.getItem(GOOGLE_STORAGE_KEYS.expiresAt) || '0');
    if (!expiresAt) return false;
    return Date.now() + 60000 >= expiresAt;
}

function notifyAuthError(message, options = {}) {
    window.showNotification(message, 'error', options);
}

function initSettings() {
    const clientIdInput = document.getElementById('google-client-id');
    const connectBtn = document.getElementById('google-connect-btn');
    const disconnectBtn = document.getElementById('google-disconnect-btn');
    const setupBtn = document.getElementById('google-setup-btn');

    if (clientIdInput) {
        clientIdInput.value = localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID) || '';
    }

    setupBtn?.addEventListener('click', () => {
        const redirectUri = getRedirectUri();
        const setupHtml = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Google OAuth Setup Guidance</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; background: #0f172a; color: #cbd5e1; line-height: 1.6; }
                    h1 { color: #fff; }
                    code { background: #1e293b; padding: 4px 8px; border-radius: 4px; color: #fb7185; }
                    ol { padding-left: 20px; }
                    li { margin-bottom: 12px; }
                </style>
            </head>
            <body>
                <h1>Google OAuth 連携の設定手順</h1>
                <ol>
                    <li><a href="https://console.cloud.google.com/" target="_blank" style="color:#60a5fa; text-decoration:none;">Google Cloud Console</a> にアクセスし、プロジェクトを作成または選択します。</li>
                    <li>「APIとサービス」 &gt; 「認証情報」に移動します。</li>
                    <li>「認証情報を作成」 &gt; 「OAuth クライアント ID」を選択します。</li>
                    <li>アプリケーションの種類として <strong>「Web アプリケーション」</strong> を選択します。</li>
                    <li>「承認されたリダイレクト URI」に以下のリダイレクトURLを追加します：<br>
                        <code>\${redirectUri}</code>
                    </li>
                    <li>作成された <strong>クライアント ID</strong> をコピーし、Nexus Dash の設定画面に入力します。</li>
                    <li>「Googleと連携」ボタンを押し、認証を行ってください。</li>
                </ol>
            </body>
            </html>
        `;
        const blob = new Blob([setupHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        chrome.tabs.create({ url: url });
    });

    connectBtn?.addEventListener('click', async () => {
        if (!clientIdInput) return;
        const val = clientIdInput.value.trim();
        if (!val) {
            window.showNotification("Google Client ID を入力してください。", "error");
            return;
        }

        localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, val);
        const success = await authenticate();
        if (success) {
            updateSettingsUI();
            window.GoogleCalendar?.loadEvents();
            window.GoogleTasks?.loadTaskLists();
            window.Gmail?.loadEmails();
        }
    });

    disconnectBtn?.addEventListener('click', () => {
        if (confirm("Googleアカウントとの連携を解除しますか？")) {
            clearToken();
            updateSettingsUI();
            window.GoogleCalendar?.loadEvents();
            window.GoogleTasks?.loadTaskLists();
            window.Gmail?.loadEmails();
            window.showNotification("Googleアカウントとの連携を解除しました。", "success");
        }
    });

    updateSettingsUI();
}

function updateSettingsUI() {
    const connectBtn = document.getElementById('google-connect-btn');
    const disconnectBtn = document.getElementById('google-disconnect-btn');
    
    if (hasStoredSession()) {
        if (connectBtn) {
            connectBtn.textContent = '連携済み';
            connectBtn.disabled = true;
            connectBtn.style.opacity = '0.7';
        }
        if (disconnectBtn) disconnectBtn.hidden = false;
    } else {
        if (connectBtn) {
            connectBtn.textContent = 'Googleと連携';
            connectBtn.disabled = false;
            connectBtn.style.opacity = '1';
        }
        if (disconnectBtn) disconnectBtn.hidden = true;
    }
}
})();
