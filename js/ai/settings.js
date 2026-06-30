(function() {
    const PROVIDERS = window.AiConstants.providers;
    const API_KEY_CONFIG = window.AiConstants.apiKeys;

    const apiKeys = {};

    function getApiKey(provider) {
        const config = API_KEY_CONFIG[provider];
        if (!config) return '';

        return window.EnvConfig?.getStorageBackedValue(config.storageKey, config.envName)
            || localStorage.getItem(config.storageKey)?.trim()
            || '';
    }

    function getAiModel(provider) {
        return window.EnvConfig?.getAiModel?.(provider)
            || window.EnvConfig?.defaultAiModels?.[provider]
            || '';
    }

    function getApiKeys() {
        return apiKeys;
    }

    function updateBoxStatus() {
        PROVIDERS.forEach(provider => {
            const config = API_KEY_CONFIG[provider];
            const box = document.getElementById(config.chatboxId);

            if (!apiKeys[provider] || !box || !box.innerHTML.includes('APIキーを設定してください')) {
                return;
            }

            box.innerHTML = `<div class="chat-msg ai-msg">${config.label} APIキー設定済み<br><small style="color:#94a3b8;">接続状態は質問送信時に確認します</small></div>`;
        });
    }

    function restoreApiKeys() {
        PROVIDERS.forEach(provider => {
            const config = API_KEY_CONFIG[provider];
            const input = document.getElementById(config.inputId);
            const value = getApiKey(provider);

            if (input) input.value = value;
            apiKeys[provider] = value;
        });
    }

    function saveApiKeys() {
        PROVIDERS.forEach(provider => {
            const config = API_KEY_CONFIG[provider];
            const input = document.getElementById(config.inputId);

            if (!input) return;

            const value = input.value.trim();
            localStorage.setItem(config.storageKey, value);
            apiKeys[provider] = value;
        });

        updateBoxStatus();
        window.showNotification('APIキーを保存しました', 'success');
        window.ApiDiagnostics?.refresh?.();
        window._toggleSidebar?.();
    }

    function bindSaveButton() {
        const saveKeysBtn = document.getElementById('save-keys-btn');
        if (!saveKeysBtn) return;

        saveKeysBtn.addEventListener('click', saveApiKeys);
    }

    function initApiKeys() {
        restoreApiKeys();
        updateBoxStatus();
        bindSaveButton();
        window._apiKeys = apiKeys;
    }

    window.AiSettings = {
        providers: PROVIDERS,
        config: API_KEY_CONFIG,
        initApiKeys,
        getApiKey,
        getApiKeys,
        getAiModel,
        updateBoxStatus
    };

    window.initApiKeys = initApiKeys;
})();
