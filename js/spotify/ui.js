// ==========================================
// Spotify プレイヤーUI
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 変数「spotifyPollInterval」を、この後の処理で使う値として用意する。
let spotifyPollInterval = null;

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initSpotify = initSpotify;

// 詳細: 関数「initSpotify」の処理ブロックを開始する。
async function initSpotify() {
    // 詳細: 変数「loginBtn」を、この後の処理で使う値として用意する。
    const loginBtn = document.getElementById('spotify-login-btn');
    // 詳細: 変数「logoutBtn」を、この後の処理で使う値として用意する。
    const logoutBtn = document.getElementById('spotify-logout-btn');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!loginBtn) return;

    // 保存済みセッションがある場合だけ、起動時にプレイヤー表示へ復帰する。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (window.SpotifyAuth.hasStoredSession()) {
        // 詳細: 変数「token」を、この後の処理で使う値として用意する。
        const token = await window.SpotifyAuth.getValidAccessToken();
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (token) {
            // 詳細: 次の処理行「showSpotifyPlayer(true);」の役割を、その場の制御フローに組み込む。
            showSpotifyPlayer(true);
            // 詳細: 次の処理行「startSpotifyPolling();」の役割を、その場の制御フローに組み込む。
            startSpotifyPolling();
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else {
            // 詳細: 次の処理行「logoutSpotify();」の役割を、その場の制御フローに組み込む。
            logoutSpotify();
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } else {
        // 詳細: 次の処理行「showSpotifyPlayer(false);」の役割を、その場の制御フローに組み込む。
        showSpotifyPlayer(false);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    loginBtn.addEventListener('click', handleSpotifyLogin);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    logoutBtn.addEventListener('click', logoutSpotify);

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    document.getElementById('spotify-play-btn').addEventListener('click', toggleSpotifyPlay);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    document.getElementById('spotify-next-btn').addEventListener('click', () => controlSpotify('next', 'POST'));
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    document.getElementById('spotify-prev-btn').addEventListener('click', () => controlSpotify('previous', 'POST'));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「handleSpotifyLogin」の処理ブロックを開始する。
async function handleSpotifyLogin() {
    // 詳細: 変数「isAuthenticated」を、この後の処理で使う値として用意する。
    const isAuthenticated = await window.SpotifyAuth.authenticate();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!isAuthenticated) return;

    // 詳細: 次の処理行「showSpotifyPlayer(true);」の役割を、その場の制御フローに組み込む。
    showSpotifyPlayer(true);
    // 詳細: 次の処理行「startSpotifyPolling();」の役割を、その場の制御フローに組み込む。
    startSpotifyPolling();
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「logoutSpotify」の処理ブロックを開始する。
function logoutSpotify() {
    // 詳細: 次の処理行「window.SpotifyAuth.clearToken();」の役割を、その場の制御フローに組み込む。
    window.SpotifyAuth.clearToken();
    // 詳細: 次の処理行「stopSpotifyPolling();」の役割を、その場の制御フローに組み込む。
    stopSpotifyPolling();
    // 詳細: 次の処理行「showSpotifyPlayer(false);」の役割を、その場の制御フローに組み込む。
    showSpotifyPlayer(false);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「showSpotifyPlayer」の処理ブロックを開始する。
function showSpotifyPlayer(isLoggedIn) {
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('spotify-login-btn').style.display = isLoggedIn ? 'none' : 'block';
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('spotify-logout-btn').style.display = isLoggedIn ? 'block' : 'none';
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('spotify-auth-prompt').style.display = isLoggedIn ? 'none' : 'block';
    // 詳細: HTML上の対象要素をIDで取得し、後続処理で操作できるようにする。
    document.getElementById('spotify-player-container').style.display = isLoggedIn ? 'flex' : 'none';
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「startSpotifyPolling」の処理ブロックを開始する。
function startSpotifyPolling() {
    // Spotify側の再生状態はpushされないため、短い間隔でポーリングする。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    // 詳細: 次の処理行「fetchSpotifyCurrentlyPlaying();」の役割を、その場の制御フローに組み込む。
    fetchSpotifyCurrentlyPlaying();
    // 詳細: 指定間隔で同じ処理を繰り返し実行する。
    spotifyPollInterval = setInterval(fetchSpotifyCurrentlyPlaying, 5000);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「stopSpotifyPolling」の処理ブロックを開始する。
function stopSpotifyPolling() {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    // 詳細: 次の処理行「spotifyPollInterval = null;」の役割を、その場の制御フローに組み込む。
    spotifyPollInterval = null;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「fetchSpotifyCurrentlyPlaying」の処理ブロックを開始する。
async function fetchSpotifyCurrentlyPlaying() {
    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 変数「res」を、この後の処理で使う値として用意する。
        const res = await window.SpotifyApi.getCurrentPlayback();
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!res) return;

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (res.status === 401) {
            // 詳細: 次の処理行「logoutSpotify();」の役割を、その場の制御フローに組み込む。
            logoutSpotify();
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (res.status === 204 || res.status === 202) {
            // 再生されていない状態も正常応答としてUIへ反映する。
            // 詳細: 次の処理行「updateSpotifyUI(null);」の役割を、その場の制御フローに組み込む。
            updateSpotifyUI(null);
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 変数「data」を、この後の処理で使う値として用意する。
        const data = await res.json();
        // 詳細: 次の処理行「updateSpotifyUI(data);」の役割を、その場の制御フローに組み込む。
        updateSpotifyUI(data);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error("Spotify Fetch Error:", e);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「updateSpotifyUI」の処理ブロックを開始する。
function updateSpotifyUI(data) {
    // 詳細: 変数「trackEl」を、この後の処理で使う値として用意する。
    const trackEl = document.getElementById('spotify-track');
    // 詳細: 変数「artistEl」を、この後の処理で使う値として用意する。
    const artistEl = document.getElementById('spotify-artist');
    // 詳細: 変数「artEl」を、この後の処理で使う値として用意する。
    const artEl = document.getElementById('spotify-art');
    // 詳細: 変数「playBtn」を、この後の処理で使う値として用意する。
    const playBtn = document.getElementById('spotify-play-btn');

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!data || !data.item) {
        // アクティブデバイスがない場合は操作対象がないことを明示する。
        // 詳細: 画面に表示するテキストを安全に更新する。
        trackEl.textContent = 'デバイスで再生されていません';
        trackEl.title = '';
        // 詳細: 画面に表示するテキストを安全に更新する。
        artistEl.textContent = '-';
        artistEl.title = '';
        // 詳細: 次の処理行「artEl.src = '';」の役割を、その場の制御フローに組み込む。
        artEl.src = '';
        artEl.alt = '';
        // 詳細: 画面に表示するテキストを安全に更新する。
        setSpotifyPlaybackButtonState(playBtn, false);
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 画面に表示するテキストを安全に更新する。
    trackEl.textContent = data.item.name;
    trackEl.title = data.item.name;
    // 詳細: 画面に表示するテキストを安全に更新する。
    artistEl.textContent = getSpotifyCreatorLabel(data.item);
    artistEl.title = artistEl.textContent;
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (data.item.album && data.item.album.images.length > 0) {
        // 詳細: 次の処理行「artEl.src = data.item.album.images[0].url;」の役割を、その場の制御フローに組み込む。
        artEl.src = data.item.album.images[0].url;
        artEl.alt = `${data.item.name} のアートワーク`;
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } else {
        // 詳細: 次の処理行「artEl.src = '';」の役割を、その場の制御フローに組み込む。
        artEl.src = '';
        artEl.alt = '';
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 次の処理行「setSpotifyPlaybackButtonState(playBtn, Boolean(data.is_playing));」の役割を、その場の制御フローに組み込む。
    setSpotifyPlaybackButtonState(playBtn, Boolean(data.is_playing));
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getSpotifyCreatorLabel」の処理ブロックを開始する。
function getSpotifyCreatorLabel(item) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (Array.isArray(item.artists) && item.artists.length > 0) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return item.artists.map(artist => artist.name).filter(Boolean).join(', ');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (item.show && item.show.name) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return item.show.name;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return '-';
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「setSpotifyPlaybackButtonState」の処理ブロックを開始する。
function setSpotifyPlaybackButtonState(playBtn, isPlaying) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!playBtn) return;

    // 詳細: 変数「playIcon」を、この後の処理で使う値として用意する。
    const playIcon = document.getElementById('spotify-play-icon');
    // 詳細: 次の処理行「playBtn.dataset.playing = isPlaying ? 'true' : 'false';」の役割を、その場の制御フローに組み込む。
    playBtn.dataset.playing = isPlaying ? 'true' : 'false';
    // 詳細: 次の処理行「playBtn.setAttribute('aria-label', isPlaying ? '一時停止' : '再生');」の役割を、その場の制御フローに組み込む。
    playBtn.setAttribute('aria-label', isPlaying ? '一時停止' : '再生');
    // 詳細: 次の処理行「playBtn.title = isPlaying ? '一時停止' : '再生';」の役割を、その場の制御フローに組み込む。
    playBtn.title = isPlaying ? '一時停止' : '再生';
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (playIcon) {
        // 詳細: 画面に表示するテキストを安全に更新する。
        playIcon.textContent = isPlaying ? '⏸︎' : '▶︎';
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「controlSpotify」の処理ブロックを開始する。
async function controlSpotify(action, method = 'PUT') {
    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 変数「res」を、この後の処理で使う値として用意する。
        const res = await window.SpotifyApi.control(action, method);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!res) return;

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (res.status === 401) {
            // 認証が失効した場合は、操作を続けずログアウト表示へ戻す。
            // 詳細: 次の処理行「logoutSpotify();」の役割を、その場の制御フローに組み込む。
            logoutSpotify();
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // Spotify側の反映に少し遅れがあるため、短い待機後に状態を取り直す。
        // 詳細: 指定時間だけ待ってから、後続の処理を実行する。
        setTimeout(fetchSpotifyCurrentlyPlaying, 500);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch(e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error(e);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「toggleSpotifyPlay」の処理ブロックを開始する。
async function toggleSpotifyPlay() {
    // 詳細: 変数「playBtn」を、この後の処理で使う値として用意する。
    const playBtn = document.getElementById('spotify-play-btn');
    // 詳細: 変数「isPlaying」を、この後の処理で使う値として用意する。
    const isPlaying = playBtn.dataset.playing === 'true';
    // 詳細: 非同期処理の完了を待ってから、次の処理へ進める。
    await controlSpotify(isPlaying ? 'pause' : 'play', 'PUT');
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
