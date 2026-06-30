(function() {
    const CHATBOX_BY_PROVIDER = Object.freeze({
        openai: 'chatbox-openai',
        anthropic: 'chatbox-anthropic',
        gemini: 'chatbox-gemini'
    });

    const TOGGLE_BY_PROVIDER = Object.freeze({
        openai: 'toggle-ai-openai',
        anthropic: 'toggle-ai-anthropic',
        gemini: 'toggle-ai-gemini'
    });

    const FETCH_BY_PROVIDER = Object.freeze({
        openai: 'fetchOpenAI',
        anthropic: 'fetchAnthropic',
        gemini: 'fetchGemini'
    });

    const DIAGNOSTIC_LABEL_BY_PROVIDER = Object.freeze({
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        gemini: 'Gemini'
    });

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

    function getVisibleProviders() {
        return Object.keys(TOGGLE_BY_PROVIDER).filter(provider => {
            return document.getElementById(TOGGLE_BY_PROVIDER[provider])?.checked;
        });
    }

    function reportMissingApiKey(provider) {
        const label = DIAGNOSTIC_LABEL_BY_PROVIDER[provider];
        addChatMessageToBox(CHATBOX_BY_PROVIDER[provider], `エラー: ${label} APIキーが未設定です。`, 'ai');
        window.ApiDiagnostics?.report(provider, 'missing', `${label} APIキー未設定`);
    }

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

    function clearInputAndDisableButton(aiGlobalInput, aiGlobalSendBtn) {
        if (aiGlobalInput) aiGlobalInput.value = '';
        if (aiGlobalSendBtn) aiGlobalSendBtn.disabled = true;
    }

    function restoreSendButton(aiGlobalSendBtn) {
        if (aiGlobalSendBtn) aiGlobalSendBtn.disabled = false;
    }

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
