// ==========================================
// Spotify Web API クライアント
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.SpotifyApi = {
    // 詳細: 次の処理行「control,」の役割を、その場の制御フローに組み込む。
    control,
    // 詳細: 次の処理行「getCurrentPlayback」の役割を、その場の制御フローに組み込む。
    getCurrentPlayback
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
};

// 詳細: 関数「getCurrentPlayback」の処理ブロックを開始する。
async function getCurrentPlayback() {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return fetchWithAuth('https://api.spotify.com/v1/me/player');
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「control」の処理ブロックを開始する。
async function control(action, method = 'PUT') {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return fetchWithAuth(`https://api.spotify.com/v1/me/player/${action}`, { method: method });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「fetchWithAuth」の処理ブロックを開始する。
async function fetchWithAuth(url, options = {}, shouldRetry = true) {
    // 詳細: 変数「token」を、この後の処理で使う値として用意する。
    const token = await window.SpotifyAuth.getValidAccessToken();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!token) return null;

    // すべてのSpotify API呼び出しに、現在有効なアクセストークンを付与する。
    // 詳細: 変数「res」を、この後の処理で使う値として用意する。
    const res = await fetch(url, {
        // 詳細: 次の処理行「...options,」の役割を、その場の制御フローに組み込む。
        ...options,
        // 詳細: 次の処理行「headers: {」の役割を、その場の制御フローに組み込む。
        headers: {
            // 詳細: 次の処理行「...(options.headers || {}),」の役割を、その場の制御フローに組み込む。
            ...(options.headers || {}),
            // 詳細: 次の処理行「'Authorization': バッククォートBearer ${token}バッククォート」の役割を、その場の制御フローに組み込む。
            'Authorization': `Bearer ${token}`
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (res.status !== 401 || !shouldRetry) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return res;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // トークン期限切れの可能性がある場合だけ更新して1回だけ再試行する。
    // 詳細: 変数「refreshedToken」を、この後の処理で使う値として用意する。
    const refreshedToken = await window.SpotifyAuth.refreshAccessToken();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!refreshedToken) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return res;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return fetchWithAuth(url, options, false);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
