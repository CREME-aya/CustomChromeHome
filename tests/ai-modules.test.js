global.window = global;

const storage = new Map();
const elements = new Map();
let failed = 0;
const tests = [];

class ElementStub {
    constructor(id = '') {
        this.id = id;
        this.innerHTML = '';
        this.value = '';
        this.checked = false;
        this.disabled = false;
        this.className = '';
        this.children = [];
        this.listeners = new Map();
        this.parentNode = null;
        this.scrollTop = 0;
        this.scrollHeight = 0;
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        this.scrollHeight = this.children.length;
    }

    remove() {
        if (!this.parentNode) return;
        this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        this.parentNode = null;
    }
}

function getElement(id) {
    if (!elements.has(id)) elements.set(id, new ElementStub(id));
    return elements.get(id);
}

function resetDom() {
    elements.clear();
    [
        'openai-api-key',
        'anthropic-api-key',
        'gemini-api-key',
        'save-keys-btn',
        'chatbox-openai',
        'chatbox-anthropic',
        'chatbox-gemini',
        'toggle-ai-openai',
        'toggle-ai-anthropic',
        'toggle-ai-gemini',
        'ai-global-input',
        'ai-global-send-btn'
    ].forEach(getElement);
}

global.document = {
    getElementById: getElement,
    createElement: () => new ElementStub()
};

global.localStorage = {
    getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
        storage.set(key, String(value));
    },
    removeItem(key) {
        storage.delete(key);
    }
};

global.EnvConfig = {
    defaultAiModels: {
        openai: 'gpt-test',
        anthropic: 'claude-test',
        gemini: 'gemini-test'
    },
    getAiModel(provider) {
        return this.defaultAiModels[provider];
    },
    getStorageBackedValue(storageKey) {
        return global.localStorage.getItem(storageKey)?.trim() || '';
    }
};
global.showNotification = () => {};
global.ApiDiagnostics = {
    reports: [],
    refreshCalled: false,
    report(provider, status, message) {
        this.reports.push({ provider, status, message });
    },
    refresh() {
        this.refreshCalled = true;
    }
};
global._toggleSidebar = () => {};

require('../js/ai/constants.js');
require('../js/ai/settings.js');
require('../js/ai/providers.js');
require('../js/ai/widget.js');
require('../js/ai.js');

function test(name, callback) {
    tests.push({ name, callback });
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('AiWidget.formatMarkdown はHTMLをエスケープし太字だけを許可する', () => {
    const formatted = window.AiWidget.formatMarkdown('<script>x</script>\n**bold**');
    assert(formatted.includes('&lt;script&gt;x&lt;/script&gt;'), 'HTMLがエスケープされていません');
    assert(formatted.includes('<br>'), '改行がHTMLへ変換されていません');
    assert(formatted.includes('<strong>bold</strong>'), '太字記法が変換されていません');
});

test('AiSettings.initApiKeys は保存済みキーを復元して状態表示を更新する', () => {
    resetDom();
    storage.set(window.AiConstants.apiKeys.openai.storageKey, 'sk-openai');
    getElement('chatbox-openai').innerHTML = 'APIキーを設定してください';

    window.initApiKeys();

    assertEqual(getElement('openai-api-key').value, 'sk-openai');
    assertEqual(window.AiSettings.getApiKeys().openai, 'sk-openai');
    assert(getElement('chatbox-openai').innerHTML.includes('OpenAI APIキー設定済み'), '設定済み表示へ更新されていません');
    assert(window._apiKeys === window.AiSettings.getApiKeys(), '互換用の _apiKeys が公開されていません');
});

test('AiProviders.fetchOpenAI はAPIリクエストを組み立てて回答本文を返す', async () => {
    resetDom();
    window.AiSettings.getApiKeys().openai = 'sk-openai';
    global.fetch = async (url, options) => {
        assertEqual(url, 'https://api.openai.com/v1/chat/completions');
        assertEqual(options.method, 'POST');
        assertEqual(options.headers.Authorization, 'Bearer sk-openai');
        const body = JSON.parse(options.body);
        assertEqual(body.model, 'gpt-test');
        assertEqual(body.messages[0].content, 'hello');
        return {
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'OpenAI response' } }] })
        };
    };

    const response = await window.AiProviders.fetchOpenAI('hello');
    assertEqual(response, 'OpenAI response');
});

test('sendToAI は表示中のAIパネルだけへ送信し入力状態を戻す', async () => {
    resetDom();
    window.AiSettings.getApiKeys().openai = 'sk-openai';
    window.AiSettings.getApiKeys().anthropic = 'sk-anthropic';
    window.AiSettings.getApiKeys().gemini = 'sk-gemini';
    getElement('toggle-ai-openai').checked = true;
    getElement('toggle-ai-anthropic').checked = false;
    getElement('toggle-ai-gemini').checked = false;
    getElement('ai-global-input').value = 'question';
    window.AiProviders.fetchOpenAI = async prompt => {
        assertEqual(prompt, 'question');
        return 'answer';
    };

    window.initMultiAI();
    await window.sendToAI('question');

    assertEqual(getElement('ai-global-input').value, '');
    assertEqual(getElement('ai-global-send-btn').disabled, false);
    assertEqual(getElement('chatbox-openai').children.length, 2);
    assertEqual(getElement('chatbox-anthropic').children.length, 0);
    assertEqual(getElement('chatbox-gemini').children.length, 0);
    assert(getElement('chatbox-openai').children[1].innerHTML.includes('answer'), '回答が描画されていません');
});

(async function run() {
    for (const { name, callback } of tests) {
        try {
            await callback();
            console.log(`PASS ${name}`);
        } catch (error) {
            failed += 1;
            console.error(`FAIL ${name}: ${error.message}`);
        }
    }

    if (failed > 0) process.exit(1);
})();
