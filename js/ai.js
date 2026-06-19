// ==========================================
// initApiKeys — APIキー管理
// ==========================================
(function() {
window.initApiKeys = initApiKeys;
window.initMultiAI = initMultiAI;

function initApiKeys() {
    const keys = ['openai', 'anthropic', 'gemini'];
    const apiKeys = {};

    function updateBoxStatus() {
        // APIキー保存後は、各チャット欄の初期メッセージを準備完了表示へ更新する。
        if (apiKeys.openai) {
            const b = document.getElementById('chatbox-openai');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">OpenAIの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
        if (apiKeys.anthropic) {
            const b = document.getElementById('chatbox-anthropic');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Claudeの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
        if (apiKeys.gemini) {
            const b = document.getElementById('chatbox-gemini');
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Geminiの準備が完了しました！<br><small style="color:#94a3b8;">※質問は上部の検索バーから入力してください</small></div>';
        }
    }

    keys.forEach(k => {
        // 入力欄と実行時参照用オブジェクトの両方に保存済みキーを復元する。
        const input = document.getElementById(`${k}-api-key`);
        if (input) {
            const val = localStorage.getItem(`custom_${k}_api_key`) || '';
            input.value = val;
            apiKeys[k] = val;
        }
    });

    updateBoxStatus();

    const saveKeysBtn = document.getElementById('save-keys-btn');
    if (saveKeysBtn) {
        saveKeysBtn.addEventListener('click', () => {
            keys.forEach(k => {
                const input = document.getElementById(`${k}-api-key`);
                if (input) {
                    const val = input.value.trim();
                    localStorage.setItem(`custom_${k}_api_key`, val);
                    apiKeys[k] = val;
                }
            });
            updateBoxStatus();
            window.showNotification('APIキーを保存しました', 'success');
            window._toggleSidebar?.();
        });
    }

    // apiKeysオブジェクトをマルチAI機能から参照するために公開
    window._apiKeys = apiKeys;
}

// ==========================================
// initMultiAI — AIチャット送信機能
// ==========================================
function initMultiAI() {
    const aiGlobalInput = document.getElementById('ai-global-input');
    const aiGlobalSendBtn = document.getElementById('ai-global-send-btn');

    function formatMarkdown(text) {
        // AI応答の最低限のMarkdownだけを、チャット欄で読めるHTMLに変換する。
        return text.replace(/\n/g, '<br>')
                   .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function addChatMessageToBox(boxId, text, sender) {
        const box = document.getElementById(boxId);
        if (!box) return;

        // APIキー催促メッセージなどをクリア
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

    async function fetchOpenAI(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.openai) {
            addChatMessageToBox(boxId, 'エラー: OpenAI APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            // ブラウザから直接呼び出すため、ユーザー保存のAPIキーをAuthorizationに使う。
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.choices[0].message.content, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    async function fetchAnthropic(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.anthropic) {
            addChatMessageToBox(boxId, 'エラー: Anthropic APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            // Anthropicのブラウザ直呼び出しに必要なヘッダーを明示する。
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKeys.anthropic,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.content[0].text, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    async function fetchGemini(prompt, boxId) {
        const apiKeys = window._apiKeys;
        if (!apiKeys.gemini) {
            addChatMessageToBox(boxId, 'エラー: Gemini APIキーが未設定です。', 'ai');
            return;
        }
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        try {
            // GeminiはAPIキーをクエリパラメータで渡す仕様に合わせる。
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKeys.gemini}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await res.json();
            loadingDiv.remove();
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            addChatMessageToBox(boxId, data.candidates[0].content.parts[0].text, 'ai');
        } catch (e) {
            loadingDiv.remove();
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
        }
    }

    window.sendToAI = async function(prompt) {
        if (!prompt) return;

        // 非表示のAIパネルには送信せず、画面上で比較できるモデルだけに投げる。
        const isOpenAIVisible = document.getElementById('toggle-ai-openai')?.checked;
        const isAnthropicVisible = document.getElementById('toggle-ai-anthropic')?.checked;
        const isGeminiVisible = document.getElementById('toggle-ai-gemini')?.checked;

        if (!isOpenAIVisible && !isAnthropicVisible && !isGeminiVisible) {
            window.showNotification('表示されているAIモデルがありません。設定から表示をONにしてください。', 'error');
            return;
        }

        if (isOpenAIVisible) addChatMessageToBox('chatbox-openai', prompt, 'user');
        if (isAnthropicVisible) addChatMessageToBox('chatbox-anthropic', prompt, 'user');
        if (isGeminiVisible) addChatMessageToBox('chatbox-gemini', prompt, 'user');

        aiGlobalInput.value = '';
        aiGlobalSendBtn.disabled = true;

        // 複数モデルの応答を待ち合わせ、全完了後に送信ボタンを戻す。
        const promises = [];
        if (isOpenAIVisible) promises.push(fetchOpenAI(prompt, 'chatbox-openai'));
        if (isAnthropicVisible) promises.push(fetchAnthropic(prompt, 'chatbox-anthropic'));
        if (isGeminiVisible) promises.push(fetchGemini(prompt, 'chatbox-gemini'));

        await Promise.all(promises);
        aiGlobalSendBtn.disabled = false;
    };

    if (aiGlobalSendBtn) {
        aiGlobalSendBtn.addEventListener('click', () => {
            window.sendToAI(aiGlobalInput.value.trim());
        });
    }

    if (aiGlobalInput) {
        aiGlobalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.sendToAI(aiGlobalInput.value.trim());
            }
        });
    }
}
})();
