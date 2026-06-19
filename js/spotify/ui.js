// ==========================================
// Spotify UI
// ==========================================
(function() {
let spotifyPollInterval = null;

window.initSpotify = initSpotify;

async function initSpotify() {
    const loginBtn = document.getElementById('spotify-login-btn');
    const logoutBtn = document.getElementById('spotify-logout-btn');
    if (!loginBtn) return;

    if (window.SpotifyAuth.hasStoredSession()) {
        const token = await window.SpotifyAuth.getValidAccessToken();
        if (token) {
            showSpotifyPlayer(true);
            startSpotifyPolling();
        } else {
            logoutSpotify();
        }
    } else {
        showSpotifyPlayer(false);
    }

    loginBtn.addEventListener('click', handleSpotifyLogin);
    logoutBtn.addEventListener('click', logoutSpotify);

    document.getElementById('spotify-play-btn').addEventListener('click', toggleSpotifyPlay);
    document.getElementById('spotify-next-btn').addEventListener('click', () => controlSpotify('next', 'POST'));
    document.getElementById('spotify-prev-btn').addEventListener('click', () => controlSpotify('previous', 'POST'));
}

async function handleSpotifyLogin() {
    const isAuthenticated = await window.SpotifyAuth.authenticate();
    if (!isAuthenticated) return;

    showSpotifyPlayer(true);
    startSpotifyPolling();
}

function logoutSpotify() {
    window.SpotifyAuth.clearToken();
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
        const res = await window.SpotifyApi.getCurrentPlayback();
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
        const res = await window.SpotifyApi.control(action, method);
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
})();
