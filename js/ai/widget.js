(function() {
    /** プロバイダーごとのチャットボックスIDマッピング */
    const CHATBOX_BY_PROVIDER = Object.freeze({
        openai: 'chatbox-openai',
        anthropic: 'chatbox-anthropic',
        gemini: 'chatbox-gemini'
    });

    /** プロバイダーごとのトグルスイッチIDマッピング */
    const TOGGLE_BY_PROVIDER = Object.freeze({
        openai: 'toggle-ai-openai',
        anthropic: 'toggle-ai-anthropic',
        gemini: 'toggle-ai-gemini'
    });

    /** プロバイダーごとのAPI呼び出し関数名マッピング */
    const FETCH_BY_PROVIDER = Object.freeze({
        openai: 'fetchOpenAI',
        anthropic: 'fetchAnthropic',
        gemini: 'fetchGemini'
    });

    /** プロバイダーごとの表示用ラベルマッピング */
    const DIAGNOSTIC_LABEL_BY_PROVIDER = Object.freeze({
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        gemini: 'Gemini'
    });

    /**
     * テキストを簡易的なMarkdown形式にフォーマットする
     * HTMLエスケープ処理と改行、太字の変換を行う
     * @param {string} text - フォーマットするテキスト
     * @returns {string} フォーマット後のHTML文字列
     */
    function formatMarkdown(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    /**
     * 指定されたチャットボックスにメッセージ要素を追加する
     * @param {string} boxId - 対象のチャットボックスID
     * @param {string} text - 追加するメッセージ内容
     * @param {string} sender - 送信者 ('user' または 'ai')
     * @returns {HTMLElement|null} 追加されたメッセージ要素、見つからない場合はnull
     */
    function addChatMessageToBox(boxId, text, sender) {
        const box = document.getElementById(boxId);
        if (!box) return null;

        if (box.innerHTML.includes('APIキーを設定してください')) {
            box.innerHTML = '';
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}-msg`;
        msgDiv.innerHTML = formatMarkdown(text);
        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
        return msgDiv;
    }

    /**
     * UI上で有効（表示対象）となっているプロバイダーのリストを取得する
     * @returns {string[]} 有効なプロバイダーの配列
     */
    function getVisibleProviders() {
        return Object.keys(TOGGLE_BY_PROVIDER).filter(provider => {
            return document.getElementById(TOGGLE_BY_PROVIDER[provider])?.checked;
        });
    }

    /**
     * APIキーが未設定であることをUIに通知し、診断レポートを送信する
     * @param {string} provider - 対象のプロバイダー名
     */
    function reportMissingApiKey(provider) {
        const label = DIAGNOSTIC_LABEL_BY_PROVIDER[provider];
        addChatMessageToBox(CHATBOX_BY_PROVIDER[provider], `エラー: ${label} APIキーが未設定です。`, 'ai');
        window.ApiDiagnostics?.report(provider, 'missing', `${label} APIキー未設定`);
    }

    /**
     * 特定のプロバイダーにプロンプトを送信し、結果をチャットボックスに表示する
     * @param {string} provider - 対象のプロバイダー名
     * @param {string} prompt - 送信するプロンプト
     * @returns {Promise<void>}
     */
    async function sendPromptToProvider(provider, prompt) {
        const settings = window.AiSettings;
        const providers = window.AiProviders;
        const label = DIAGNOSTIC_LABEL_BY_PROVIDER[provider];
        const chatboxId = CHATBOX_BY_PROVIDER[provider];

        if (!settings?.getApiKeys?.()[provider]) {
            reportMissingApiKey(provider);
            return;
        }

        const loadingDiv = addChatMessageToBox(chatboxId, '考え中...', 'ai');

        try {
            const responseText = await providers[FETCH_BY_PROVIDER[provider]](prompt);
            loadingDiv?.remove();
            addChatMessageToBox(chatboxId, responseText, 'ai');
            window.ApiDiagnostics?.report(provider, 'ok', `${label} API 応答成功`);
        } catch (error) {
            loadingDiv?.remove();
            addChatMessageToBox(chatboxId, `エラー: ${error.message}`, 'ai');
            window.ApiDiagnostics?.report(provider, 'error', `${label} API エラー: ${error.message}`);
        }
    }

    /**
     * 入力欄をクリアし、送信ボタンを無効化する
     * @param {HTMLInputElement} aiGlobalInput - 入力フィールド要素
     * @param {HTMLButtonElement} aiGlobalSendBtn - 送信ボタン要素
     */
    function clearInputAndDisableButton(aiGlobalInput, aiGlobalSendBtn) {
        if (aiGlobalInput) aiGlobalInput.value = '';
        if (aiGlobalSendBtn) aiGlobalSendBtn.disabled = true;
    }

    /**
     * 送信ボタンを再度有効化する
     * @param {HTMLButtonElement} aiGlobalSendBtn - 送信ボタン要素
     */
    function restoreSendButton(aiGlobalSendBtn) {
        if (aiGlobalSendBtn) aiGlobalSendBtn.disabled = false;
    }

    /**
     * すべての有効なAIプロバイダーへ送信処理を行う関数を生成する
     * @param {HTMLInputElement|null} aiGlobalInput - 入力フィールド要素
     * @param {HTMLButtonElement|null} aiGlobalSendBtn - 送信ボタン要素
     * @returns {Function} AIへの送信を実行する非同期関数
     */
    function createSendToAI(aiGlobalInput, aiGlobalSendBtn) {
        return async function sendToAI(prompt) {
            if (!prompt) return;

            const visibleProviders = getVisibleProviders();
            if (visibleProviders.length === 0) {
                window.showNotification('表示されているAIモデルがありません。設定から表示をONにしてください。', 'error');
                return;
            }

            visibleProviders.forEach(provider => {
                addChatMessageToBox(CHATBOX_BY_PROVIDER[provider], prompt, 'user');
            });

            clearInputAndDisableButton(aiGlobalInput, aiGlobalSendBtn);

            await Promise.all(visibleProviders.map(provider => sendPromptToProvider(provider, prompt)));
            restoreSendButton(aiGlobalSendBtn);
        };
    }

    /**
     * UI要素に対して送信アクションのイベントリスナーを登録する
     * @param {HTMLInputElement|null} aiGlobalInput - 入力フィールド要素
     * @param {HTMLButtonElement|null} aiGlobalSendBtn - 送信ボタン要素
     */
    function bindSendControls(aiGlobalInput, aiGlobalSendBtn) {
        if (aiGlobalSendBtn) {
            aiGlobalSendBtn.addEventListener('click', () => {
                window.sendToAI(aiGlobalInput?.value.trim());
            });
        }

        if (aiGlobalInput) {
            aiGlobalInput.addEventListener('keypress', event => {
                if (event.key === 'Enter') {
                    window.sendToAI(aiGlobalInput.value.trim());
                }
            });
        }
    }

    /**
     * 複数AIプロバイダー連携機能の初期化処理
     */
    function initMultiAI() {
        const aiGlobalInput = document.getElementById('ai-global-input');
        const aiGlobalSendBtn = document.getElementById('ai-global-send-btn');

        window.sendToAI = createSendToAI(aiGlobalInput, aiGlobalSendBtn);
        bindSendControls(aiGlobalInput, aiGlobalSendBtn);
    }

    window.AiWidget = {
        initMultiAI,
        addChatMessageToBox,
        formatMarkdown
    };

    window.initMultiAI = initMultiAI;
})();
