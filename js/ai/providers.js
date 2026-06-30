(function() {
    class MissingApiKeyError extends Error {
        constructor(providerLabel) {
            super(`${providerLabel} APIキーが未設定です。`);
            this.name = 'MissingApiKeyError';
        }
    }

    function getSettings() {
        if (!window.AiSettings) {
            throw new Error('AI設定モジュールが読み込まれていません。');
        }

        return window.AiSettings;
    }

    function getApiKey(provider) {
        const key = getSettings().getApiKeys()[provider];
        return key || '';
    }

    function requireApiKey(provider, label) {
        const key = getApiKey(provider);
        if (!key) throw new MissingApiKeyError(label);
        return key;
    }

    async function readJsonResponse(response) {
        try {
            return await response.json();
        } catch (error) {
            throw new Error('APIレスポンスをJSONとして読み取れませんでした。');
        }
    }

    async function fetchOpenAI(prompt) {
        const apiKey = requireApiKey('openai', 'OpenAI');
        const model = getSettings().getAiModel('openai');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) throw new Error('OpenAI APIから回答本文が返されませんでした。');

        return responseText;
    }

    async function fetchAnthropic(prompt) {
        const apiKey = requireApiKey('anthropic', 'Anthropic');
        const model = getSettings().getAiModel('anthropic');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        const responseText = data.content?.find(part => part.type === 'text')?.text;
        if (!responseText) throw new Error('Anthropic APIから回答本文が返されませんでした。');

        return responseText;
    }

    async function fetchGemini(prompt) {
        const apiKey = requireApiKey('gemini', 'Gemini');
        const model = getSettings().getAiModel('gemini');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await readJsonResponse(response);

        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        const responseText = data.candidates?.[0]?.content?.parts
            ?.filter(part => typeof part.text === 'string')
            .map(part => part.text)
            .join('');
        if (!responseText) throw new Error('Gemini APIから回答本文が返されませんでした。');

        return responseText;
    }

    window.AiProviders = {
        MissingApiKeyError,
        fetchOpenAI,
        fetchAnthropic,
        fetchGemini
    };
})();
