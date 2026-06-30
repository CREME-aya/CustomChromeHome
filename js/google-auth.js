// ==========================================
// Google OAuth 2.0 認証とトークン管理
// ==========================================
(function() {
const GOOGLE_SCOPE_LIST = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/gmail.readonly'
];
const GOOGLE_SCOPES = GOOGLE_SCOPE_LIST.join(' ');
const GOOGLE_SCOPE_LABELS = {
    'https://www.googleapis.com/auth/calendar': 'Google カレンダー',
    'https://www.googleapis.com/auth/tasks': 'Google Tasks',
    'https://www.googleapis.com/auth/gmail.readonly': 'Gmail 読み取り'
};
let isAuthenticating = false;

window.GoogleAuth = {
    initSettings,
    authenticate,
    clearToken,
    getValidAccessToken,
    hasStoredSession,
    refreshAccessToken,
    getRedirectUri,
    getMissingRequiredScopes,
    getConfiguredClientId: getGoogleClientId,
    createApiError
};

function getRedirectUri() {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL) {
        return chrome.identity.getRedirectURL();
    }
    const extId = typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : 'dummy';
    return `https://${extId}.chromiumapp.org/`;
}

function getGoogleClientId() {
    return getManifestGoogleClientId();
}

async function authenticate() {
    const clientId = getGoogleClientId();
    if (!clientId) {
        notifyAuthError("manifest.json の oauth2.client_id が未設定です。Google Cloud Console で作成した Chrome 拡張機能用 Client ID を manifest.json に設定してください。", { durationMs: 12000 });
        return false;
    }

    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.getAuthToken) {
        notifyAuthError("Chrome拡張機能として動作していないか、identity権限がありません。");
        return false;
    }

    try {
        clearToken();
        const tokenResult = await getGoogleIdentityToken(true);
        if (!tokenResult?.token) {
            notifyAuthError("Google アクセストークンを取得できませんでした。");
            return false;
        }

        const grantedScopeString = scopeListToString(tokenResult.grantedScopes);
        const missingScopes = getMissingRequiredScopes(grantedScopeString);
        if (missingScopes.length > 0) {
            clearToken();
            notifyAuthError(
                `Google 認証で必要な権限が許可されていません: ${formatScopeLabels(missingScopes)}。再連携時にすべての権限を許可してください。`,
                { durationMs: 9000 }
            );
            window.ApiDiagnostics?.report('google-auth', 'error', 'Google OAuth の権限が不足しています');
            return false;
        }

        saveToken({
            access_token: tokenResult.token,
            expires_in: 3300,
            scope: grantedScopeString
        });
        localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, clientId);
        window.showNotification("Google 連携に成功しました！", "success");
        window.ApiDiagnostics?.report('google-auth', 'ok', 'Google OAuth 連携成功');
        return true;
    } catch(e) {
        console.error("Auth Error:", e);
        notifyAuthError(formatGoogleAuthError(e), { durationMs: 12000 });
        window.ApiDiagnostics?.report('google-auth', 'error', e.message || 'Google OAuth 認証に失敗');
        return false;
    }
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
    if (data.expires_in) {
        const expiresAt = Date.now() + (Number(data.expires_in) * 1000);
        localStorage.setItem(GOOGLE_STORAGE_KEYS.expiresAt, String(expiresAt));
    }
    if (data.scope) {
        localStorage.setItem(GOOGLE_STORAGE_KEYS.grantedScopes, normalizeScopeString(data.scope));
    }
}

function clearToken() {
    removeCachedGoogleToken(localStorage.getItem(GOOGLE_STORAGE_KEYS.accessToken));
    Object.values(GOOGLE_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.ApiDiagnostics?.report('google-auth', 'missing', 'Google 連携なし');
}

function hasStoredSession() {
    return Boolean(localStorage.getItem(GOOGLE_STORAGE_KEYS.accessToken));
}

async function getValidAccessToken() {
    const missingScopes = getMissingRequiredScopes();
    if (missingScopes.length > 0) {
        notifyAuthError(
            `Google 連携の権限が不足しています: ${formatScopeLabels(missingScopes)}。Google 連携を解除してから再連携してください。`,
            { durationMs: 9000 }
        );
        window.ApiDiagnostics?.report('google-auth', 'error', 'Google OAuth の権限が不足しています');
        return null;
    }

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
    try {
        const tokenResult = await getGoogleIdentityToken(false);
        if (tokenResult?.token) {
            const grantedScopeString = scopeListToString(tokenResult.grantedScopes);
            if (getMissingRequiredScopes(grantedScopeString).length > 0) {
                return null;
            }
            saveToken({
                access_token: tokenResult.token,
                expires_in: 3300,
                scope: grantedScopeString
            });
        }
        return tokenResult?.token || null;
    } catch(e) {
        console.error("Google token refresh error:", e);
        clearToken();
        return null;
    }
}

function getGoogleIdentityToken(interactive) {
    return new Promise((resolve, reject) => {
        const clientId = getGoogleClientId();
        const redirectUri = getRedirectUri();
        const scopes = encodeURIComponent(GOOGLE_SCOPE_LIST.join(' '));
        const prompt = interactive ? 'select_account' : 'none';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&prompt=${prompt}`;

        const timeoutId = setTimeout(() => {
            if (interactive) {
                reject(new Error("認証がタイムアウトしました。ポップアップがブロックされていないか確認してください。"));
            } else {
                resolve(null);
            }
        }, 60000);

        try {
            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive
            }, (redirectUrl) => {
                clearTimeout(timeoutId);
                if (chrome.runtime.lastError || !redirectUrl) {
                    const msg = chrome.runtime.lastError?.message || 'キャンセルされました';
                    if (!interactive) return resolve(null);
                    reject(new Error(msg));
                    return;
                }
                try {
                    const url = new URL(redirectUrl.replace('#', '?'));
                    const token = url.searchParams.get('access_token');
                    if (!token) {
                        if (!interactive) return resolve(null);
                        reject(new Error('トークンが取得できませんでした。'));
                        return;
                    }
                    resolve({
                        token,
                        grantedScopes: GOOGLE_SCOPE_LIST
                    });
                } catch (e) {
                    if (!interactive) return resolve(null);
                    reject(e);
                }
            });
        } catch (e) {
            clearTimeout(timeoutId);
            if (!interactive) return resolve(null);
            reject(e);
        }
    });
}

function removeCachedGoogleToken(token) {
    if (!token || typeof chrome === 'undefined' || !chrome.identity?.removeCachedAuthToken) {
        return;
    }
    chrome.identity.removeCachedAuthToken({ token }, () => void chrome.runtime.lastError);
}

function isTokenExpiringSoon() {
    const expiresAt = Number(localStorage.getItem(GOOGLE_STORAGE_KEYS.expiresAt) || '0');
    if (!expiresAt) return false;
    return Date.now() + 60000 >= expiresAt;
}

function getMissingRequiredScopes(grantedScopeString = localStorage.getItem(GOOGLE_STORAGE_KEYS.grantedScopes)) {
    if (!grantedScopeString) return [];

    const grantedScopes = new Set(normalizeScopeString(grantedScopeString).split(' ').filter(Boolean));
    return GOOGLE_SCOPE_LIST.filter(scope => !grantedScopes.has(scope));
}

function normalizeScopeString(scopeString) {
    return String(scopeString || '')
        .split(/\s+/)
        .filter(Boolean)
        .sort()
        .join(' ');
}

function scopeListToString(scopes) {
    return normalizeScopeString(Array.isArray(scopes) ? scopes.join(' ') : GOOGLE_SCOPES);
}

function formatScopeLabels(scopes) {
    return scopes.map(scope => GOOGLE_SCOPE_LABELS[scope] || scope).join('、');
}

async function createApiError(res, serviceLabel) {
    const data = await parseTokenResponse(res);
    const apiMessage = data.error?.message || data.error_description || data.error || `HTTP ${res.status}`;
    const reason = data.error?.errors?.[0]?.reason || '';

    let message = `${serviceLabel} へのアクセスに失敗しました。${apiMessage}`;
    if (res.status === 401) {
        removeCachedGoogleToken(localStorage.getItem(GOOGLE_STORAGE_KEYS.accessToken));
        localStorage.removeItem(GOOGLE_STORAGE_KEYS.accessToken);
        localStorage.removeItem(GOOGLE_STORAGE_KEYS.expiresAt);
        message = 'Google 認証の有効期限が切れています。Google 連携を解除してから再連携してください。';
    } else if (res.status === 403 && isScopeError(apiMessage, reason)) {
        message = `${serviceLabel} の権限が不足しています。Google 連携を解除してから再連携し、必要な権限をすべて許可してください。`;
    } else if (res.status === 403) {
        message = `${serviceLabel} へのアクセスが拒否されました。Google Cloud Console で対象 API が有効化されているか、OAuth 同意画面のスコープとテストユーザー設定を確認してください。`;
    }

    const error = new Error(message);
    error.status = res.status;
    error.reason = reason;
    error.apiMessage = apiMessage;
    return error;
}

function isScopeError(apiMessage, reason) {
    return reason === 'insufficientPermissions'
        || /insufficient authentication scopes/i.test(apiMessage)
        || /insufficient permissions/i.test(apiMessage);
}

function notifyAuthError(message, options = {}) {
    window.showNotification(message, 'error', options);
}

function formatGoogleAuthError(error) {
    const message = error?.message || String(error || '');
    if (/Invalid OAuth2 Client ID/i.test(message)) {
        return `Google OAuth Client ID が無効です。Google Cloud Console で「Chrome 拡張機能」用 OAuth クライアントを作成し、拡張機能 ID「${getChromeExtensionId()}」を登録してください。その Client ID を manifest.json の oauth2.client_id に設定後、chrome://extensions で拡張機能をリロードしてください。`;
    }
    if (/OAuth2 not granted or revoked/i.test(message)) {
        return 'Google OAuth の許可が取り消されたか未許可です。Google 連携を解除してから再連携し、Calendar / Tasks / Gmail の権限をすべて許可してください。';
    }
    return `Googleの認証に失敗しました。詳細: ${message}`;
}

function getManifestGoogleClientId() {
    return typeof chrome !== 'undefined' && chrome.runtime?.getManifest
        ? chrome.runtime.getManifest().oauth2?.client_id || ''
        : '';
}

function initSettings() {
    const clientIdDisplay = document.getElementById('google-client-id');
    const extensionIdDisplay = document.getElementById('google-extension-id');
    const connectBtn = document.getElementById('google-connect-btn');
    const disconnectBtn = document.getElementById('google-disconnect-btn');
    const setupBtn = document.getElementById('google-setup-btn');
    const manifestClientId = getManifestGoogleClientId();

    if (clientIdDisplay) {
        clientIdDisplay.textContent = manifestClientId || 'manifest.json の oauth2.client_id が未設定です';
    }
    if (extensionIdDisplay) {
        extensionIdDisplay.textContent = getChromeExtensionId();
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
                    <li>「APIとサービス」 &gt; 「有効な API とサービス」で <strong>Google Calendar API</strong>、<strong>Google Tasks API</strong>、<strong>Gmail API</strong> を有効化します。</li>
                    <li>「OAuth 同意画面」で Calendar / Tasks / Gmail のスコープを追加します。テスト公開中の場合は、利用する Google アカウントをテストユーザーに追加します。</li>
                    <li>「APIとサービス」 &gt; 「認証情報」に移動します。</li>
                    <li>「認証情報を作成」 &gt; 「OAuth クライアント ID」を選択します。</li>
                    <li>アプリケーションの種類として <strong>「Web アプリケーション」</strong> (または「Chrome 拡張機能」) を選択します。</li>
                    <li>「Web アプリケーション」を選んだ場合、「承認済みのリダイレクト URI」に以下のURIを追加してください：<br>
                        <code>${redirectUri}</code>
                    </li>
                    <li>拡張機能 ID に以下の値を登録します（Chrome 拡張機能を選んだ場合）：<br>
                        <code>${getChromeExtensionId()}</code>
                    </li>
                    <li>この拡張機能の <code>manifest.json</code> に設定されている Client ID は以下です：<br>
                        <code>${manifestClientId || '未設定'}</code>
                    </li>
                    <li>作成された <strong>クライアント ID</strong> が <code>manifest.json</code> の <code>oauth2.client_id</code> と一致していることを確認します。</li>
                    <li>「Googleと連携」ボタンを押し、Calendar / Tasks / Gmail の権限をすべて許可してください。</li>
                </ol>
                <p>この拡張機能で使うリダイレクト URI は <code>${redirectUri}</code> です。通常は Chrome 拡張機能クライアント ID と拡張機能 ID の組み合わせで認証します。</p>
            </body>
            </html>
        `;
        const blob = new Blob([setupHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        chrome.tabs.create({ url: url });
    });

    connectBtn?.addEventListener('click', async () => {
        if (isAuthenticating) return;

        const clientId = getManifestGoogleClientId();
        if (!clientId) {
            window.showNotification("manifest.json の oauth2.client_id が未設定です。", "error", { durationMs: 9000 });
            return;
        }

        isAuthenticating = true;
        updateSettingsUI();

        try {
            localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, clientId);
            window.ApiDiagnostics?.refresh?.();
            const success = await authenticate();
            if (success) {
                dispatchGoogleConnectionEvent('google:connected');
            }
        } finally {
            isAuthenticating = false;
            updateSettingsUI();
            window.ApiDiagnostics?.refresh?.();
        }
    });

    disconnectBtn?.addEventListener('click', () => {
        if (confirm("Googleアカウントとの連携を解除しますか？")) {
            clearToken();
            updateSettingsUI();
            dispatchGoogleConnectionEvent('google:disconnected');
            window.showNotification("Googleアカウントとの連携を解除しました。", "success");
            window.ApiDiagnostics?.refresh?.();
        }
    });

    updateSettingsUI();
}

function dispatchGoogleConnectionEvent(eventName) {
    document.dispatchEvent(new CustomEvent(eventName));
}

function getChromeExtensionId() {
    return typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : '拡張機能ID';
}

function updateSettingsUI() {
    const connectBtn = document.getElementById('google-connect-btn');
    const disconnectBtn = document.getElementById('google-disconnect-btn');

    if (isAuthenticating) {
        if (connectBtn) {
            connectBtn.textContent = '連携中...';
            connectBtn.disabled = true;
            connectBtn.style.opacity = '0.7';
        }
        if (disconnectBtn) disconnectBtn.hidden = true;
        return;
    }

    if (connectBtn) {
        connectBtn.textContent = hasStoredSession() ? 'Googleと再連携' : 'Googleと連携';
        connectBtn.disabled = false;
        connectBtn.style.opacity = '1';
    }

    if (hasStoredSession()) {
        if (disconnectBtn) disconnectBtn.hidden = false;
    } else {
        if (disconnectBtn) disconnectBtn.hidden = true;
    }
}
})();
