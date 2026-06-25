// ==========================================
// メディアコントローラー (Spotify / YouTube 切り替え)
// ==========================================
(function() {
let mediaPollInterval = null;

window.initMediaController = initMediaController;

function initMediaController() {
    setupMediaModeSettings();
    applyMediaMode();

    // モード切り替えを監視して適用
    const mediaRadios = document.querySelectorAll('input[name="media-mode"]');
    mediaRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_MEDIA_MODE, radio.value);
            applyMediaMode();
        });
    });

    // キャプチャフェーズでイベントをインターセプトする
    const playBtn = document.getElementById('spotify-play-btn');
    const nextBtn = document.getElementById('spotify-next-btn');
    const prevBtn = document.getElementById('spotify-prev-btn');

    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            if (getMediaMode() === 'youtube') {
                e.stopImmediatePropagation();
                toggleYouTubePlay();
            }
        }, true);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            if (getMediaMode() === 'youtube') {
                e.stopImmediatePropagation();
                controlYouTube('next');
            }
        }, true);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            if (getMediaMode() === 'youtube') {
                e.stopImmediatePropagation();
                controlYouTube('prev');
            }
        }, true);
    }
}

function getMediaMode() {
    return localStorage.getItem(STORAGE_KEY_MEDIA_MODE) || 'spotify';
}

function setupMediaModeSettings() {
    const stored = getMediaMode();
    const radio = document.querySelector(`input[name="media-mode"][value="${stored}"]`);
    if (radio) radio.checked = true;
}

// メディアモードの適用
function applyMediaMode() {
    const mode = getMediaMode();
    const widgetHeader = document.querySelector('#spotify-widget .widget-header span');
    const spotifyAuthPrompt = document.getElementById('spotify-auth-prompt');
    const spotifyPlayerContainer = document.getElementById('spotify-player-container');
    const spotifyLogoutBtn = document.getElementById('spotify-logout-btn');

    if (mediaPollInterval) {
        clearInterval(mediaPollInterval);
        mediaPollInterval = null;
    }

    if (mode === 'youtube') {
        if (widgetHeader) widgetHeader.textContent = 'YouTube プレイヤー';
        
        if (spotifyAuthPrompt) spotifyAuthPrompt.style.setProperty('display', 'none', 'important');
        if (spotifyPlayerContainer) spotifyPlayerContainer.style.setProperty('display', 'flex', 'important');
        if (spotifyLogoutBtn) spotifyLogoutBtn.style.setProperty('display', 'none', 'important');

        startYouTubePolling();
    } else {
        if (widgetHeader) widgetHeader.textContent = 'Spotify';
        if (spotifyLogoutBtn) spotifyLogoutBtn.style.removeProperty('display');
        
        if (window.SpotifyAuth && window.SpotifyAuth.hasStoredSession()) {
            if (spotifyAuthPrompt) spotifyAuthPrompt.style.setProperty('display', 'none', 'important');
            if (spotifyPlayerContainer) spotifyPlayerContainer.style.setProperty('display', 'flex', 'important');
        } else {
            if (spotifyAuthPrompt) spotifyAuthPrompt.style.setProperty('display', 'flex', 'important');
            if (spotifyPlayerContainer) spotifyPlayerContainer.style.setProperty('display', 'none', 'important');
        }

        updatePlayButtonIcon(false);
    }
}

// --- YouTube コントロールロジック ---

async function getYouTubeTab() {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.tabs) {
            resolve(null);
            return;
        }
        chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
            if (tabs && tabs.length > 0) {
                const activeTab = tabs.find(t => t.active) || tabs.find(t => t.audible) || tabs[0];
                resolve(activeTab);
            } else {
                resolve(null);
            }
        });
    });
}

async function executeOnYouTube(func) {
    const tab = await getYouTubeTab();
    if (!tab) return null;
    
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.scripting) {
            resolve(null);
            return;
        }
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: func
        }, (results) => {
            if (results && results[0]) {
                resolve(results[0].result);
            } else {
                resolve(null);
            }
        });
    });
}

function startYouTubePolling() {
    updateYouTubeUI({
        title: "読込中...",
        author: "-",
        art: "",
        playing: false
    });

    const poll = async () => {
        if (getMediaMode() !== 'youtube') return;

        const tab = await getYouTubeTab();
        if (!tab) {
            updateYouTubeUI({
                title: "YouTube タブが開いていません",
                author: "YouTubeで動画を再生してください",
                art: "https://www.youtube.com/s/desktop/20fd28a4/img/favicon_144x144.png",
                playing: false
            });
            return;
        }

        const info = await executeOnYouTube(() => {
            const video = document.querySelector('video');
            if (!video) return null;

            const titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('meta[name="title"]');
            const authorEl = document.querySelector('ytd-channel-name a') || document.querySelector('meta[name="author"]');
            
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('v');
            const artUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

            return {
                title: titleEl?.textContent?.trim() || document.title.replace(" - YouTube", ""),
                author: authorEl?.textContent?.trim() || "YouTube",
                art: artUrl,
                playing: !video.paused
            };
        });

        if (info) {
            updateYouTubeUI(info);
        } else {
            updateYouTubeUI({
                title: tab.title.replace(" - YouTube", ""),
                author: "YouTube",
                art: "https://www.youtube.com/s/desktop/20fd28a4/img/favicon_144x144.png",
                playing: false
            });
        }
    };

    poll();
    mediaPollInterval = setInterval(poll, 2000);
}

function updateYouTubeUI(info) {
    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    const artImg = document.getElementById('spotify-art');

    if (trackEl) trackEl.textContent = info.title;
    if (artistEl) artistEl.textContent = info.author;
    if (artImg) {
        artImg.src = info.art || 'https://www.youtube.com/s/desktop/20fd28a4/img/favicon_144x144.png';
        artImg.style.display = 'block';
    }

    updatePlayButtonIcon(info.playing);
}

function updatePlayButtonIcon(isPlaying) {
    const playBtn = document.getElementById('spotify-play-btn');
    const playIcon = document.getElementById('spotify-play-icon');
    if (playBtn && playIcon) {
        playBtn.setAttribute('data-playing', isPlaying ? 'true' : 'false');
        playIcon.textContent = isPlaying ? '⏸︎' : '▶︎';
    }
}

async function toggleYouTubePlay() {
    const tab = await getYouTubeTab();
    if (!tab) {
        window.showNotification("YouTube のタブが見つかりません。新規に開きます。", "info");
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: "https://www.youtube.com" });
        }
        return;
    }

    executeOnYouTube(() => {
        const video = document.querySelector('video');
        if (video) {
            if (video.paused) {
                video.play();
                return { paused: false };
            } else {
                video.pause();
                return { paused: true };
            }
        }
        return null;
    }).then(res => {
        if (res) updatePlayButtonIcon(!res.paused);
    });
}

async function controlYouTube(action) {
    const tab = await getYouTubeTab();
    if (!tab) return;

    if (action === 'next') {
        executeOnYouTube(() => {
            const nextBtn = document.querySelector('.ytp-next-button');
            if (nextBtn) nextBtn.click();
        });
    } else if (action === 'prev') {
        executeOnYouTube(() => {
            const video = document.querySelector('video');
            if (video) {
                if (video.currentTime > 5) {
                    video.currentTime = 0;
                } else {
                    window.history.back();
                }
            }
        });
    }
}
})();
