// ==========================================
// Spotify プレイヤーUI
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 変数「spotifyPollInterval」を、この後の処理で使う値として用意する。
let spotifyPollInterval = null;

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initSpotify = initSpotify;

/**
 * Spotify機能の初期化処理
 * - UIイベントリスナーの登録
 * - 既存セッションの復元とプレイヤー状態の更新
 */
async function initSpotify() {
    const loginBtn = document.getElementById('spotify-login-btn');
    const logoutBtn = document.getElementById('spotify-logout-btn');
    const setupBtn = document.getElementById('spotify-setup-btn');
    if (!loginBtn) return;

    // 保存済みセッションがある場合だけ、起動時にプレイヤー表示へ復帰する。
    if (window.SpotifyAuth.hasStoredSession()) {
        const token = await window.SpotifyAuth.getValidAccessToken();
        if (token) {
            showSpotifyPlayer(true);
            window.ApiDiagnostics?.report('spotify', 'idle', 'Spotify 連携済み。再生状態取得を待機');
            startSpotifyPolling();
        } else {
            logoutSpotify();
        }
    } else {
        showSpotifyPlayer(false);
        window.ApiDiagnostics?.report('spotify', 'missing', 'Spotify 未連携');
    }

    loginBtn.addEventListener('click', handleSpotifyLogin);
    logoutBtn.addEventListener('click', logoutSpotify);
    setupBtn?.addEventListener('click', openSpotifySetupPage);
    refreshSpotifySettingsError();

    document.getElementById('spotify-play-btn').addEventListener('click', toggleSpotifyPlay);
    document.getElementById('spotify-next-btn').addEventListener('click', () => controlSpotify('next', 'POST'));
    document.getElementById('spotify-prev-btn').addEventListener('click', () => controlSpotify('previous', 'POST'));
}

/**
 * Spotifyログインボタンのクリックハンドラー
 * 認証を行い、成功すればプレイヤーUIを表示してポーリングを開始する
 */
async function handleSpotifyLogin() {
    const isAuthenticated = await window.SpotifyAuth.authenticate();
    if (!isAuthenticated) {
        refreshSpotifySettingsError();
        return;
    }

    refreshSpotifySettingsError();
    showSpotifyPlayer(true);
    window.ApiDiagnostics?.report('spotify', 'idle', 'Spotify 連携済み。再生状態取得を待機');
    startSpotifyPolling();
}

/**
 * Spotifyログアウト処理
 * セッションを破棄し、UIを未連携状態に戻す
 */
function logoutSpotify() {
    window.SpotifyAuth.clearToken();
    stopSpotifyPolling();
    showSpotifyPlayer(false);
    window.ApiDiagnostics?.report('spotify', 'missing', 'Spotify 未連携');
}

/**
 * Spotify設定ページを開く
 */
function openSpotifySetupPage() {
    const hasChromeApi = typeof chrome !== 'undefined';
    const setupUrl = hasChromeApi && chrome.runtime?.getURL
        ? chrome.runtime.getURL('spotify-setup.html')
        : 'spotify-setup.html';

    if (hasChromeApi && chrome.tabs?.create) {
        chrome.tabs.create({ url: setupUrl, active: true }, () => {
            if (chrome.runtime.lastError) {
                window.showNotification(`Spotify 設定ページを開けませんでした。${chrome.runtime.lastError.message}`, 'error');
            }
        });
        return;
    }

    window.open(setupUrl, '_blank');
}

/**
 * 認証エラーの表示を更新する
 */
function refreshSpotifySettingsError() {
    const errorElement = document.getElementById('spotify-settings-error');
    if (!errorElement) return;

    const lastError = window.SpotifyConfig.getLastAuthError();
    errorElement.hidden = !lastError;
    errorElement.textContent = lastError
        ? `直近のエラー: ${lastError.message}`
        : '';
}

/**
 * ログイン状態に応じてプレイヤーUIとログインUIの表示を切り替える
 * @param {boolean} isLoggedIn ログインしているかどうか
 */
function showSpotifyPlayer(isLoggedIn) {
    document.getElementById('spotify-login-btn').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-logout-btn').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('spotify-auth-prompt').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('spotify-player-container').style.display = isLoggedIn ? 'flex' : 'none';
}

/**
 * 定期的にSpotifyの再生状態を取得するポーリングを開始する
 */
function startSpotifyPolling() {
    // Spotify側の再生状態はpushされないため、短い間隔でポーリングする。
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    fetchSpotifyCurrentlyPlaying();
    spotifyPollInterval = setInterval(fetchSpotifyCurrentlyPlaying, 5000);
}

/**
 * Spotifyの再生状態ポーリングを停止する
 */
function stopSpotifyPolling() {
    if (spotifyPollInterval) clearInterval(spotifyPollInterval);
    spotifyPollInterval = null;
}

/**
 * APIを叩いてSpotifyの現在の再生状態を取得し、UIを更新する
 */
async function fetchSpotifyCurrentlyPlaying() {
    try {
        const res = await window.SpotifyApi.getCurrentPlayback();
        if (!res) return;

        if (res.status === 401) {
            logoutSpotify();
            return;
        }

        if (res.status === 204 || res.status === 202) {
            // 再生されていない状態も正常応答としてUIへ反映する。
            updateSpotifyUI(null);
            window.ApiDiagnostics?.report('spotify', 'ok', 'Spotify 再生状態取得成功');
            return;
        }

        const data = await res.json();
        updateSpotifyUI(data);
        window.ApiDiagnostics?.report('spotify', 'ok', 'Spotify 再生状態取得成功');
    } catch(e) {
        console.error("Spotify Fetch Error:", e);
        window.ApiDiagnostics?.report('spotify', 'error', `Spotify 再生状態取得失敗: ${e.message}`);
    }
}

/**
 * 取得した再生状態データを元にUIを更新する
 * @param {Object|null} data 再生状態のJSONデータ。再生されていない場合はnull
 */
function updateSpotifyUI(data) {
    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    const artEl = document.getElementById('spotify-art');
    const playBtn = document.getElementById('spotify-play-btn');

    if (!data || !data.item) {
        // アクティブデバイスがない場合は操作対象がないことを明示する。
        trackEl.textContent = 'デバイスで再生されていません';
        trackEl.title = '';
        artistEl.textContent = '-';
        artistEl.title = '';
        artEl.src = '';
        artEl.alt = '';
        setSpotifyPlaybackButtonState(playBtn, false);
        return;
    }

    trackEl.textContent = data.item.name;
    trackEl.title = data.item.name;
    artistEl.textContent = getSpotifyCreatorLabel(data.item);
    artistEl.title = artistEl.textContent;

    if (data.item.album && data.item.album.images.length > 0) {
        artEl.src = data.item.album.images[0].url;
        artEl.alt = `${data.item.name} のアートワーク`;
    } else {
        artEl.src = '';
        artEl.alt = '';
    }

    setSpotifyPlaybackButtonState(playBtn, Boolean(data.is_playing));
}

/**
 * アイテム情報からアーティスト名や番組名を取得する
 * @param {Object} item Spotifyアイテムオブジェクト
 * @returns {string} アーティスト名または番組名。取得できない場合は '-'
 */
function getSpotifyCreatorLabel(item) {
    if (Array.isArray(item.artists) && item.artists.length > 0) {
        return item.artists.map(artist => artist.name).filter(Boolean).join(', ');
    }

    if (item.show && item.show.name) {
        return item.show.name;
    }

    return '-';
}

/**
 * 再生ボタンのUI状態（再生中/一時停止中）を更新する
 * @param {HTMLElement} playBtn 再生ボタンの要素
 * @param {boolean} isPlaying 再生中かどうか
 */
function setSpotifyPlaybackButtonState(playBtn, isPlaying) {
    if (!playBtn) return;

    const playIcon = document.getElementById('spotify-play-icon');
    playBtn.dataset.playing = isPlaying ? 'true' : 'false';
    playBtn.setAttribute('aria-label', isPlaying ? '一時停止' : '再生');
    playBtn.title = isPlaying ? '一時停止' : '再生';

    if (playIcon) {
        playIcon.textContent = isPlaying ? '⏸︎' : '▶︎';
    }
}

/**
 * Spotifyへの再生制御APIを呼び出す
 * @param {string} action アクション名（play, pause, next, previous等）
 * @param {string} method HTTPメソッド
 */
async function controlSpotify(action, method = 'PUT') {
    try {
        const res = await window.SpotifyApi.control(action, method);
        if (!res) return;

        if (res.status === 401) {
            // 認証が失効した場合は、操作を続けずログアウト表示へ戻す。
            logoutSpotify();
            return;
        }
        // Spotify側の反映に少し遅れがあるため、短い待機後に状態を取り直す。
        setTimeout(fetchSpotifyCurrentlyPlaying, 500);
    } catch(e) {
        console.error(e);
    }
}

/**
 * 再生ボタンクリック時に、現在の状態に応じて再生・一時停止をトグルする
 */
async function toggleSpotifyPlay() {
    const playBtn = document.getElementById('spotify-play-btn');
    const isPlaying = playBtn.dataset.playing === 'true';
    await controlSpotify(isPlaying ? 'pause' : 'play', 'PUT');
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
