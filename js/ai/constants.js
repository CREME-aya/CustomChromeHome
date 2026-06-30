(function() {
    const PROVIDERS = Object.freeze(['openai', 'anthropic', 'gemini']);

    const API_KEYS = Object.freeze({
        openai: Object.freeze({
            storageKey: 'custom_openai_api_key',
            envName: 'NEXUS_OPENAI_API_KEY',
            inputId: 'openai-api-key',
            chatboxId: 'chatbox-openai',
            label: 'OpenAI'
        }),
        anthropic: Object.freeze({
            storageKey: 'custom_anthropic_api_key',
            envName: 'NEXUS_ANTHROPIC_API_KEY',
            inputId: 'anthropic-api-key',
            chatboxId: 'chatbox-anthropic',
            label: 'Anthropic'
        }),
        gemini: Object.freeze({
            storageKey: 'custom_gemini_api_key',
            envName: 'NEXUS_GEMINI_API_KEY',
            inputId: 'gemini-api-key',
            chatboxId: 'chatbox-gemini',
            label: 'Gemini'
        })
    });

    window.AiConstants = Object.freeze({
        providers: PROVIDERS,
        apiKeys: API_KEYS
    });
})();
