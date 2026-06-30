// ==========================================
// Spotify 認証とトークン保存
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
function getSpotifyClientId() {
    return window.EnvConfig?.getSpotifyClientId?.()
        || window.EnvConfig?.defaultSpotifyClientId
        || '3ed94377fd3840f2b3f3e88967a2ed78';
}
// 詳細: 変数「SPOTIFY_SCOPES」を、この後の処理で使う値として用意する。
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

// 詳細: 関数「authenticate」の処理ブロックを開始する。
async function authenticate() {
    window.SpotifyConfig.clearAuthError();
    // chrome.identity.launchWebAuthFlow が使える環境（Chrome拡張）かチェックする。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
        // 詳細: 次の処理行「window.showNotification("Chrome拡張機能として動作していないか、identity権限がありません。", 'error');」の役割を、その場の制御フローに組み込む。
        notifyAuthError("Chrome拡張機能として動作していないか、identity権限がありません。");
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return false;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「redirectUri」を、この後の処理で使う値として用意する。
    const redirectUri = window.SpotifyConfig.getRedirectUri();
    // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
    console.log("Spotify Redirect URI:", redirectUri);

    // クライアントシークレットを持たない拡張なので、PKCEで認証コードを受け取る。
    // 詳細: 変数「codeVerifier」を、この後の処理で使う値として用意する。
    const codeVerifier = generateRandomString(64);
    // 詳細: 変数「codeChallenge」を、この後の処理で使う値として用意する。
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    // 詳細: 変数「state」を、この後の処理で使う値として用意する。
    const state = generateRandomString(32);

    // 詳細: 変数「authParams」を、この後の処理で使う値として用意する。
    const authParams = new URLSearchParams({
        // 詳細: オブジェクトのプロパティ値を定義する。
        client_id: getSpotifyClientId(),
        // 詳細: オブジェクトのプロパティ値を定義する。
        response_type: 'code',
        // 詳細: オブジェクトのプロパティ値を定義する。
        redirect_uri: redirectUri,
        // 詳細: オブジェクトのプロパティ値を定義する。
        scope: SPOTIFY_SCOPES,
        // 詳細: オブジェクトのプロパティ値を定義する。
        code_challenge_method: 'S256',
        // 詳細: オブジェクトのプロパティ値を定義する。
        code_challenge: codeChallenge,
        // 詳細: オブジェクトのプロパティ値を定義する。
        state: state,
        // 詳細: 次の処理行「show_dialog: 'true'」の役割を、その場の制御フローに組み込む。
        show_dialog: 'true'
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
    // 詳細: 変数「authUrl」を、この後の処理で使う値として用意する。
    const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
    // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
    console.log("Spotify Auth URL:", authUrl);

    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 変数「redirectUrl」を、この後の処理で使う値として用意する。
        const redirectUrl = await launchSpotifyAuthFlow(authUrl, redirectUri);
        // 詳細: 変数「urlObj」を、この後の処理で使う値として用意する。
        const urlObj = new URL(redirectUrl);
        // 詳細: 変数「error」を、この後の処理で使う値として用意する。
        const error = urlObj.searchParams.get('error');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (error) {
            // 詳細: 次の処理行「window.showNotification(バッククォートSpotifyの認証に失敗しました。理由: ${error}バッククォート, 'error');」の役割を、その場の制御フローに組み込む。
            notifyAuthError(`Spotifyの認証に失敗しました。理由: ${error}`);
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return false;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (urlObj.searchParams.get('state') !== state) {
            // 詳細: 次の処理行「window.showNotification("Spotifyの認証応答を検証できませんでした。もう一度連携してください。", 'error');」の役割を、その場の制御フローに組み込む。
            notifyAuthError("Spotifyの認証応答を検証できませんでした。もう一度連携してください。");
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return false;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 変数「code」を、この後の処理で使う値として用意する。
        const code = urlObj.searchParams.get('code');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!code) {
            // 詳細: 次の処理行「window.showNotification("認証コードが取得できませんでした。", 'error');」の役割を、その場の制御フローに組み込む。
            notifyAuthError("認証コードが取得できませんでした。");
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return false;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // 詳細: 変数「tokenData」を、この後の処理で使う値として用意する。
            const tokenData = await requestToken({
                // 詳細: オブジェクトのプロパティ値を定義する。
                grant_type: 'authorization_code',
                // 詳細: オブジェクトのプロパティ値を定義する。
                code: code,
                // 詳細: オブジェクトのプロパティ値を定義する。
                redirect_uri: redirectUri,
                // 詳細: 次の処理行「code_verifier: codeVerifier」の役割を、その場の制御フローに組み込む。
                code_verifier: codeVerifier
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });

            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (tokenData.access_token) {
                // 詳細: 次の処理行「saveToken(tokenData);」の役割を、その場の制御フローに組み込む。
                saveToken(tokenData);
                window.SpotifyConfig.clearAuthError();
                // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
                return true;
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return false;
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch(e) {
            // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
            console.error(e);
            // 詳細: 次の処理行「window.showNotification(バッククォートSpotifyトークンの取得に失敗しました。${e.message}バッククォート, 'error');」の役割を、その場の制御フローに組み込む。
            notifyAuthError(`Spotifyトークンの取得に失敗しました。${e.message}`);
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return false;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error("Auth Error:", e);
        // 詳細: 次の処理行「window.showNotification(バッククォートSpotifyの認証ページを開けませんでした。Redirect URI を確認してください。詳細: ${e.messa」の役割を、その場の制御フローに組み込む。
        notifyAuthError(`Spotifyの認証ページを開けませんでした。Redirect URI を確認してください。詳細: ${e.message}`, { durationMs: 7000 });
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return false;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「generateRandomString」の処理ブロックを開始する。
function generateRandomString(length) {
    // state と code_verifier は予測しづらい値にする必要がある。
    // 詳細: 変数「possible」を、この後の処理で使う値として用意する。
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // 詳細: 変数「values」を、この後の処理で使う値として用意する。
    const values = crypto.getRandomValues(new Uint8Array(length));
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「generateCodeChallenge」の処理ブロックを開始する。
async function generateCodeChallenge(codeVerifier) {
    // SpotifyのPKCE要件に合わせて SHA-256 + base64url へ変換する。
    // 詳細: 変数「data」を、この後の処理で使う値として用意する。
    const data = new TextEncoder().encode(codeVerifier);
    // 詳細: 変数「digest」を、この後の処理で使う値として用意する。
    const digest = await crypto.subtle.digest('SHA-256', data);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        // 詳細: 次の処理行「.replace(/\+/g, '-')」の役割を、その場の制御フローに組み込む。
        .replace(/\+/g, '-')
        // 詳細: 次の処理行「.replace(/\//g, '_')」の役割を、その場の制御フローに組み込む。
        .replace(/\//g, '_')
        // 詳細: 次の処理行「.replace(/=+$/, '');」の役割を、その場の制御フローに組み込む。
        .replace(/=+$/, '');
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「launchSpotifyAuthFlow」の処理ブロックを開始する。
async function launchSpotifyAuthFlow(authUrl, redirectUri) {
    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return await launchSpotifyAuthFlowWithIdentity(authUrl);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 一部環境ではidentityフローが失敗するため、通常タブ監視へフォールバックする。
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.warn("chrome.identity.launchWebAuthFlow failed. Falling back to a normal tab.", e);
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return launchSpotifyAuthFlowInTab(authUrl, redirectUri);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「launchSpotifyAuthFlowWithIdentity」の処理ブロックを開始する。
function launchSpotifyAuthFlowWithIdentity(authUrl) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return new Promise((resolve, reject) => {
        // 詳細: 次の処理行「chrome.identity.launchWebAuthFlow({」の役割を、その場の制御フローに組み込む。
        chrome.identity.launchWebAuthFlow({
            // 詳細: オブジェクトのプロパティ値を定義する。
            url: authUrl,
            // 詳細: 次の処理行「interactive: true」の役割を、その場の制御フローに組み込む。
            interactive: true
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        }, (redirectUrl) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (chrome.runtime.lastError || !redirectUrl) {
                // 詳細: 次の処理行「reject(new Error(chrome.runtime.lastError?.message || '認証応答がありません。'));」の役割を、その場の制御フローに組み込む。
                reject(new Error(chrome.runtime.lastError?.message || '認証応答がありません。'));
                // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
                return;
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 次の処理行「resolve(redirectUrl);」の役割を、その場の制御フローに組み込む。
            resolve(redirectUrl);
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「launchSpotifyAuthFlowInTab」の処理ブロックを開始する。
function launchSpotifyAuthFlowInTab(authUrl, redirectUri) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!chrome.tabs?.create || !chrome.tabs?.onUpdated) {
        // 詳細: 異常状態を呼び出し元へ明示的に伝える。
        throw new Error('通常タブで認証を開くための chrome.tabs API が利用できません。');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return new Promise((resolve, reject) => {
        // 詳細: 変数「authTabId」を、この後の処理で使う値として用意する。
        let authTabId = null;
        // 詳細: 変数「timeoutId」を、この後の処理で使う値として用意する。
        let timeoutId = null;

        // 認証完了・失敗・タイムアウトのどの場合でもリスナーを残さない。
        // 詳細: 変数「cleanup」を、この後の処理で使う値として用意する。
        const cleanup = () => {
            // 詳細: 次の処理行「chrome.tabs.onUpdated.removeListener(handleUpdated);」の役割を、その場の制御フローに組み込む。
            chrome.tabs.onUpdated.removeListener(handleUpdated);
            // 詳細: 次の処理行「chrome.tabs.onRemoved.removeListener(handleRemoved);」の役割を、その場の制御フローに組み込む。
            chrome.tabs.onRemoved.removeListener(handleRemoved);
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (timeoutId) clearTimeout(timeoutId);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };

        // 詳細: 変数「finish」を、この後の処理で使う値として用意する。
        const finish = (redirectUrl) => {
            // 詳細: 次の処理行「cleanup();」の役割を、その場の制御フローに組み込む。
            cleanup();
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (authTabId !== null) {
                // 詳細: 不要になったDOM要素を画面から取り除く。
                chrome.tabs.remove(authTabId, () => void chrome.runtime.lastError);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 次の処理行「resolve(redirectUrl);」の役割を、その場の制御フローに組み込む。
            resolve(redirectUrl);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };

        // 詳細: 変数「handleUpdated」を、この後の処理で使う値として用意する。
        const handleUpdated = (tabId, changeInfo) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (tabId !== authTabId || !changeInfo.url) return;
            // redirect URI へ戻った瞬間に認証コード付きURLを回収する。
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (changeInfo.url.startsWith(redirectUri)) {
                // 詳細: 次の処理行「finish(changeInfo.url);」の役割を、その場の制御フローに組み込む。
                finish(changeInfo.url);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };

        // 詳細: 変数「handleRemoved」を、この後の処理で使う値として用意する。
        const handleRemoved = (tabId) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (tabId !== authTabId) return;
            // 詳細: 次の処理行「cleanup();」の役割を、その場の制御フローに組み込む。
            cleanup();
            // 詳細: 次の処理行「reject(new Error('認証タブが閉じられました。'));」の役割を、その場の制御フローに組み込む。
            reject(new Error('認証タブが閉じられました。'));
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };

        // 詳細: 次の処理行「chrome.tabs.onUpdated.addListener(handleUpdated);」の役割を、その場の制御フローに組み込む。
        chrome.tabs.onUpdated.addListener(handleUpdated);
        // 詳細: 次の処理行「chrome.tabs.onRemoved.addListener(handleRemoved);」の役割を、その場の制御フローに組み込む。
        chrome.tabs.onRemoved.addListener(handleRemoved);

        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        chrome.tabs.create({ url: authUrl, active: true }, (tab) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (chrome.runtime.lastError || !tab?.id) {
                // 詳細: 次の処理行「cleanup();」の役割を、その場の制御フローに組み込む。
                cleanup();
                // 詳細: 次の処理行「reject(new Error(chrome.runtime.lastError?.message || '認証タブを作成できませんでした。'));」の役割を、その場の制御フローに組み込む。
                reject(new Error(chrome.runtime.lastError?.message || '認証タブを作成できませんでした。'));
                // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
                return;
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 次の処理行「authTabId = tab.id;」の役割を、その場の制御フローに組み込む。
            authTabId = tab.id;
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });

        // 詳細: 指定時間だけ待ってから、後続の処理を実行する。
        timeoutId = setTimeout(() => {
            // 詳細: 次の処理行「cleanup();」の役割を、その場の制御フローに組み込む。
            cleanup();
            // 詳細: 次の処理行「reject(new Error('Spotify 認証がタイムアウトしました。'));」の役割を、その場の制御フローに組み込む。
            reject(new Error('Spotify 認証がタイムアウトしました。'));
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        }, 120000);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「requestToken」の処理ブロックを開始する。
async function requestToken(params) {
    // 認証コード交換とリフレッシュの両方で同じtoken endpointを使う。
    // 詳細: 変数「body」を、この後の処理で使う値として用意する。
    const body = new URLSearchParams({
        // 詳細: オブジェクトのプロパティ値を定義する。
        client_id: getSpotifyClientId(),
        // 詳細: 次の処理行「...params」の役割を、その場の制御フローに組み込む。
        ...params
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 変数「res」を、この後の処理で使う値として用意する。
    const res = await fetch('https://accounts.spotify.com/api/token', {
        // 詳細: オブジェクトのプロパティ値を定義する。
        method: 'POST',
        // 詳細: 次の処理行「headers: {」の役割を、その場の制御フローに組み込む。
        headers: {
            // 詳細: 次の処理行「'Content-Type': 'application/x-www-form-urlencoded'」の役割を、その場の制御フローに組み込む。
            'Content-Type': 'application/x-www-form-urlencoded'
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 次の処理行「body: body.toString()」の役割を、その場の制御フローに組み込む。
        body: body.toString()
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 変数「data」を、この後の処理で使う値として用意する。
    const data = await parseTokenResponse(res);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!res.ok) {
        // 詳細: 変数「message」を、この後の処理で使う値として用意する。
        const message = data.error_description || data.error || `HTTP ${res.status}`;
        // 詳細: 異常状態を呼び出し元へ明示的に伝える。
        throw new Error(message);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return data;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseTokenResponse」の処理ブロックを開始する。
async function parseTokenResponse(res) {
    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return await res.json();
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return {};
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「saveToken」の処理ブロックを開始する。
function saveToken(data) {
    // refresh_token は返らない場合があるため、存在する値だけ上書きする。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (data.access_token) {
        // 詳細: ユーザー設定や状態を localStorage に保存する。
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.accessToken, data.access_token);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (data.refresh_token) {
        // 詳細: ユーザー設定や状態を localStorage に保存する。
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.refreshToken, data.refresh_token);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (data.expires_in) {
        // 詳細: 変数「expiresAt」を、この後の処理で使う値として用意する。
        const expiresAt = Date.now() + (Number(data.expires_in) * 1000);
        // 詳細: ユーザー設定や状態を localStorage に保存する。
        localStorage.setItem(SPOTIFY_STORAGE_KEYS.expiresAt, String(expiresAt));
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「clearToken」の処理ブロックを開始する。
function clearToken() {
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    Object.values(SPOTIFY_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「hasStoredSession」の処理ブロックを開始する。
function hasStoredSession() {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return Boolean(
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken) ||
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken)
    // 詳細: 次の処理行「);」の役割を、その場の制御フローに組み込む。
    );
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getValidAccessToken」の処理ブロックを開始する。
async function getValidAccessToken() {
    // 詳細: 変数「token」を、この後の処理で使う値として用意する。
    const token = localStorage.getItem(SPOTIFY_STORAGE_KEYS.accessToken);
    // 詳細: 変数「isTokenExpiring」を、この後の処理で使う値として用意する。
    const isTokenExpiring = isTokenExpiringSoon();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (token && !isTokenExpiring) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return token;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 期限切れ間近ならAPI呼び出し前に更新して、401の発生を減らす。
    // 詳細: 変数「refreshedToken」を、この後の処理で使う値として用意する。
    const refreshedToken = await refreshAccessToken();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (refreshedToken) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return refreshedToken;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return isTokenExpiring ? null : token;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「refreshAccessToken」の処理ブロックを開始する。
async function refreshAccessToken() {
    // 詳細: 変数「refreshToken」を、この後の処理で使う値として用意する。
    const refreshToken = localStorage.getItem(SPOTIFY_STORAGE_KEYS.refreshToken);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!refreshToken) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return null;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 変数「tokenData」を、この後の処理で使う値として用意する。
        const tokenData = await requestToken({
            // 詳細: オブジェクトのプロパティ値を定義する。
            grant_type: 'refresh_token',
            // 詳細: 次の処理行「refresh_token: refreshToken」の役割を、その場の制御フローに組み込む。
            refresh_token: refreshToken
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
        // 詳細: 次の処理行「saveToken(tokenData);」の役割を、その場の制御フローに組み込む。
        saveToken(tokenData);
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return tokenData.access_token || null;
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error("Spotify token refresh error:", e);
        window.SpotifyConfig.saveAuthError(`Spotifyトークンの更新に失敗しました。${e.message}`);
        // 詳細: 次の処理行「clearToken();」の役割を、その場の制御フローに組み込む。
        clearToken();
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return null;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「isTokenExpiringSoon」の処理ブロックを開始する。
function isTokenExpiringSoon() {
    // 詳細: 変数「expiresAt」を、この後の処理で使う値として用意する。
    const expiresAt = Number(localStorage.getItem(SPOTIFY_STORAGE_KEYS.expiresAt) || '0');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!expiresAt) return false;
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return Date.now() + SPOTIFY_TOKEN_REFRESH_MARGIN_MS >= expiresAt;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

function notifyAuthError(message, options = {}) {
    window.SpotifyConfig.saveAuthError(message);
    window.showNotification(message, 'error', options);
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
