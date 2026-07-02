(function() {
    /** サポートされるプロバイダーのリストへの参照 */
    const PROVIDERS = window.AiConstants.providers;
    /** APIキーの設定定義への参照 */
    const API_KEY_CONFIG = window.AiConstants.apiKeys;

    /** キャッシュされたAPIキーを保持するオブジェクト */
    const apiKeys = {};

    /**
     * 指定されたプロバイダーのAPIキーを設定またはストレージから取得する
     * @param {string} provider - プロバイダー名
     * @returns {string} APIキー
     */
    function getApiKey(provider) {
        const config = API_KEY_CONFIG[provider];
        if (!config) return '';

        return window.EnvConfig?.getStorageBackedValue(config.storageKey, config.envName)
            || localStorage.getItem(config.storageKey)?.trim()
            || '';
    }

    /**
     * 指定されたプロバイダーのAIモデル名を取得する
     * @param {string} provider - プロバイダー名
     * @returns {string} モデル名
     */
    function getAiModel(provider) {
        return window.EnvConfig?.getAiModel?.(provider)
            || window.EnvConfig?.defaultAiModels?.[provider]
            || '';
    }

    /**
     * キャッシュされたすべてのAPIキーを取得する
     * @returns {Object} プロバイダー名をキーとするAPIキーのマップ
     */
    function getApiKeys() {
        return apiKeys;
    }

    /**
     * APIキーが設定されている場合、UI上のチャットボックスの状態を更新する
     */
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

    /**
     * ストレージからAPIキーを読み込み、入力フォームに復元する
     */
    function restoreApiKeys() {
        PROVIDERS.forEach(provider => {
            const config = API_KEY_CONFIG[provider];
            const input = document.getElementById(config.inputId);
            const value = getApiKey(provider);

            if (input) input.value = value;
            apiKeys[provider] = value;
        });
    }

    /**
     * 入力フォームのAPIキーをストレージに保存し、関連するUIや状態を更新する
     */
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

    /**
     * 保存ボタンにイベントリスナーを登録する
     */
    function bindSaveButton() {
        const saveKeysBtn = document.getElementById('save-keys-btn');
        if (!saveKeysBtn) return;

        saveKeysBtn.addEventListener('click', saveApiKeys);
    }

    /**
     * APIキー管理機能の初期化処理
     */
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
