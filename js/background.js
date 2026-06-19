// ==========================================
// initBackground — 背景画像設定（ランダム、カスタム、クリア）
// ==========================================
(function() {
window.initBackground = initBackground;

function initBackground() {
    const bgUrlInput = document.getElementById('bg-url-input');
    const bgFileInput = document.getElementById('local-bg-input') || document.getElementById('bg-file-input');
    const saveBgBtn = document.getElementById('save-bg-btn');
    const clearBgBtn = document.getElementById('clear-bg-btn');
    const randomBgBtn = document.getElementById('random-bg-btn');

    const savedBg = localStorage.getItem(STORAGE_KEY_BG);
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
    }

    function applyBackground(imgUrl) {
        // Base64はサイズが大きい場合があるため、LocalStorageの容量制限に注意する。
        try {
            localStorage.setItem(STORAGE_KEY_BG, imgUrl);
            document.body.style.backgroundImage = `url(${imgUrl})`;
        } catch (e) {
            window.showNotification('画像の保存に失敗しました。ファイルサイズが大きすぎる可能性があります。', 'error');
        }
    }

    randomBgBtn?.addEventListener('click', () => {
        const randomUrl = PRESET_BACKGROUNDS[Math.floor(Math.random() * PRESET_BACKGROUNDS.length)];
        applyBackground(randomUrl);
    });

    function applySelectedBackground() {
        const file = bgFileInput?.files?.[0];
        const bgUrl = bgUrlInput?.value?.trim();
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                applyBackground(dataUrl);
            };
            reader.readAsDataURL(file);
        } else if (bgUrl) {
            applyBackground(bgUrl);
        }
    }

    saveBgBtn?.addEventListener('click', applySelectedBackground);
    bgFileInput?.addEventListener('change', applySelectedBackground);

    clearBgBtn?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_BG);
        document.body.style.backgroundImage = '';
        if (bgUrlInput) bgUrlInput.value = '';
        if (bgFileInput) bgFileInput.value = '';
    });
}
})();
