// ==========================================
// Spotify 認証とトークン保存
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
/**
 * SpotifyクライアントIDを取得する
 * @returns {string} クライアントID
 */
function getSpotifyClientId() {
    return window.EnvConfig?.getSpotifyClientId?.()
        || window.EnvConfig?.defaultSpotifyClientId
        || '3ed94377fd3840f2b3f3e88967a2ed78';
}

/** @constant {string} 要求するSpotifyのスコープ */
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.SpotifyAuth = {
    // 詳細: 次の処理行「authenticate,」の役割を、その場の制御フローに組み込む。
    authenticate,
    // 詳細: 次の処理行「clearToken,」の役割を、その場の制御フローに組み込む。
    clearToken,
    // 詳細: 次の処理行「getValidAccessToken,」の役割を、その場の制御フローに組み込む。
    getValidAccessToken,
    // 詳細: 次の処理行「hasStoredSession,」の役割を、その場の制御フローに組み込む。
    hasStoredSession,
    // 詳細: 次の処理行「refreshAccessToken」の役割を、その場の制御フローに組み込む。
    refreshAccessToken
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
};

/**
 * Spotifyの認証フロー（PKCE）を開始し、アクセストークンを取得する
 * @returns {Promise<boolean>} 認証成功時にtrue、失敗時にfalse
 */
async function authenticate() {
    window.SpotifyConfig.clearAuthError();
    // chrome.identity.launchWebAuthFlow が使える環境（Chrome拡張）かチェックする。
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        notifyAuthError("Chrome拡張機能として動作していないか、identity権限がありません。");
        return false;
    }

    const redirectUri = window.SpotifyConfig.getRedirectUri();
    console.log("Spotify Redirect URI:", redirectUri);

    // クライアントシークレットを持たない拡張なので、PKCEで認証コードを受け取る。
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    const authParams = new URLSearchParams({
        client_id: getSpotifyClientId(),
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
            notifyAuthError(`Spotifyの認証に失敗しました。理由: ${error}`);
            return false;
        }

        if (urlObj.searchParams.get('state') !== state) {
            notifyAuthError("Spotifyの認証応答を検証できませんでした。もう一度連携してください。");
            return false;
        }

        const code = urlObj.searchParams.get('code');
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
                window.SpotifyConfig.clearAuthError();
                return true;
            }
            return false;
        } catch(e) {
            console.error(e);
            notifyAuthError(`Spotifyトークンの取得に失敗しました。${e.message}`);
            return false;
        }
    } catch(e) {
        console.error("Auth Error:", e);
        notifyAuthError(`Spotifyの認証ページを開けませんでした。Redirect URI を確認してください。詳細: ${e.message}`, { durationMs: 7000 });
        return false;
    }
}

/**
 * 指定した長さのランダムな文字列を生成する
 * @param {number} length 生成する文字列の長さ
 * @returns {string} 生成されたランダム文字列
 */
function generateRandomString(length) {
    // state と code_verifier は予測しづらい値にする必要がある。
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

/**
 * code_verifier から SHA-256 と base64url エンコードで code_challenge を生成する
 * @param {string} codeVerifier ランダムな検証用文字列
 * @returns {Promise<string>} 生成されたコードチャレンジ
 */
async function generateCodeChallenge(codeVerifier) {
    // SpotifyのPKCE要件に合わせて SHA-256 + base64url へ変換する。
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Web認証フローを起動し、リダイレクトされたURLを取得する
 * identityフローに失敗した場合は通常タブでの認証にフォールバックする
 * @param {string} authUrl 認証用URL
 * @param {string} redirectUri 完了時に戻ってくるリダイレクトURI
 * @returns {Promise<string>} リダイレクト後のURL文字列
 */
async function launchSpotifyAuthFlow(authUrl, redirectUri) {
    try {
        return await launchSpotifyAuthFlowWithIdentity(authUrl);
    } catch(e) {
        // 一部環境ではidentityフローが失敗するため、通常タブ監視へフォールバックする。
        console.warn("chrome.identity.launchWebAuthFlow failed. Falling back to a normal tab.", e);
        return launchSpotifyAuthFlowInTab(authUrl, redirectUri);
    }
}

/**
 * chrome.identity API を用いて認証フローを開始する
 * @param {string} authUrl 認証用URL
 * @returns {Promise<string>} リダイレクト後のURL文字列
 */
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

/**
 * 通常のタブを開いて認証フローを開始し、リダイレクト先への到達を監視する
 * @param {string} authUrl 認証用URL
 * @param {string} redirectUri 完了時に戻ってくるリダイレクトURI
 * @returns {Promise<string>} リダイレクト後のURL文字列
 */
function launchSpotifyAuthFlowInTab(authUrl, redirectUri) {
    if (!chrome.tabs?.create || !chrome.tabs?.onUpdated) {
        throw new Error('通常タブで認証を開くための chrome.tabs API が利用できません。');
    }

    return new Promise((resolve, reject) => {
        let authTabId = null;
        let timeoutId = null;

        // 認証完了・失敗・タイムアウトのどの場合でもリスナーを残さない。
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
            // redirect URI へ戻った瞬間に認証コード付きURLを回収する。
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

/**
 * トークンエンドポイントへリクエストを送り、アクセストークンを取得・更新する
 * @param {Object} params リクエストパラメータオブジェクト
 * @returns {Promise<Object>} トークン情報オブジェクト
 */
async function requestToken(params) {
    // 認証コード交換とリフレッシュの両方で同じtoken endpointを使う。
    const body = new URLSearchParams({
        client_id: getSpotifyClientId(),
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

/**
 * トークンエンドポイントからのレスポンスをJSONとしてパースする
 * @param {Response} res fetchのResponseオブジェクト
 * @returns {Promise<Object>} パースされたオブジェクト（失敗時は空オブジェクト）
 */
async function parseTokenResponse(res) {
    try {
        return await res.json();
    } catch(e) {
        return {};
    }
}

/**
 * 取得したトークン情報をlocalStorageに保存する
 * @param {Object} data APIから返されたトークンデータ
 */
function saveToken(data) {
    // refresh_token は返らない場合があるため、存在する値だけ上書きする。
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

/**
 * localStorageに保存されているすべてのSpotify関連トークンを削除する
 */
function clearToken() {
    Object.values(SPOTIFY_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

/**
 * 保存されているセッション（アクセストークンかリフレッシュトークン）があるかチェックする
 * @returns {boolean} セッションが存在すればtrue
 */
function hasStoredSession() {
    return Boolean(
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken) ||
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken)
    );
}

/**
 * 有効なアクセストークンを取得する（期限切れ間近ならリフレッシュする）
 * @returns {Promise<string|null>} アクセストークン。取得できない場合はnull
 */
async function getValidAccessToken() {
    const token = localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken);
    const isTokenExpiring = isTokenExpiringSoon();

    if (token && !isTokenExpiring) {
        return token;
    }

    // 期限切れ間近ならAPI呼び出し前に更新して、401の発生を減らす。
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
        return refreshedToken;
    }

    return isTokenExpiring ? null : token;
}

/**
 * リフレッシュトークンを使用して新しいアクセストークンを取得する
 * @returns {Promise<string|null>} 新しいアクセストークン。失敗した場合はnull
 */
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
        window.SpotifyConfig.saveAuthError(`Spotifyトークンの更新に失敗しました。${e.message}`);
        clearToken();
        return null;
    }
}

/**
 * トークンの有効期限が間近（または既に切れているか）を判定する
 * @returns {boolean} 期限間近ならtrue
 */
function isTokenExpiringSoon() {
    const expiresAt = Number(localStorage.getItem(SPOTIFY_STORAGE_KEYS.expiresAt) || '0');
    if (!expiresAt) return false;

    return Date.now() + SPOTIFY_TOKEN_REFRESH_MARGIN_MS >= expiresAt;
}

/**
 * 認証エラーを保存し、通知として表示する
 * @param {string} message エラーメッセージ
 * @param {Object} options 通知オプション
 */
function notifyAuthError(message, options = {}) {
    window.SpotifyConfig.saveAuthError(message);
    window.showNotification(message, 'error', options);
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
