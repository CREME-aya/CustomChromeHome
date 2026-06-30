// ==========================================
// .env 設定ローダー
// ==========================================
(function() {
const ENV_FILE_PATHS = ['.env', '.env.local'];

const ENV_NAMES = Object.freeze({
    openaiApiKey: 'NEXUS_OPENAI_API_KEY',
    anthropicApiKey: 'NEXUS_ANTHROPIC_API_KEY',
    geminiApiKey: 'NEXUS_GEMINI_API_KEY',
    googleClientId: 'NEXUS_GOOGLE_CLIENT_ID',
    githubPat: 'NEXUS_GITHUB_PAT',
    googleFinanceCsvUrl: 'NEXUS_GOOGLEFINANCE_CSV_URL',
    spotifyClientId: 'NEXUS_SPOTIFY_CLIENT_ID',
    openaiModel: 'NEXUS_OPENAI_MODEL',
    anthropicModel: 'NEXUS_ANTHROPIC_MODEL',
    geminiModel: 'NEXUS_GEMINI_MODEL'
});

const DEFAULT_AI_MODELS = Object.freeze({
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-6',
    gemini: 'gemini-3.5-flash'
});

const DEFAULT_SPOTIFY_CLIENT_ID = '3ed94377fd3840f2b3f3e88967a2ed78';

const envValues = {};
let lastLoadError = null;

const ready = loadEnvFiles();

window.EnvConfig = {
    ready,
    names: ENV_NAMES,
    defaultAiModels: DEFAULT_AI_MODELS,
    defaultSpotifyClientId: DEFAULT_SPOTIFY_CLIENT_ID,
    get,
    getStorageBackedValue,
    hasStorageBackedValue,
    getAiModel,
    getSpotifyClientId,
    getLastLoadError,
    parseEnvText
};

async function loadEnvFiles() {
    for (const path of ENV_FILE_PATHS) {
        try {
            const loadedValues = await fetchEnvFile(path);
            Object.assign(envValues, loadedValues);
        } catch (error) {
            lastLoadError = error;
            console.warn(`${path} を読み込めませんでした。`, error);
        }
    }
    return { ...envValues };
}

async function fetchEnvFile(path) {
    if (typeof fetch !== 'function') return {};

    const response = await fetch(resolveEnvUrl(path), { cache: 'no-store' });
    if (!response.ok) return {};

    const text = await response.text();
    return parseEnvText(text);
}

function resolveEnvUrl(path) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        return chrome.runtime.getURL(path);
    }
    return path;
}

function parseEnvText(text) {
    return String(text || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .reduce((values, rawLine) => {
            const parsed = parseEnvLine(rawLine);
            if (parsed) values[parsed.key] = parsed.value;
            return values;
        }, {});
}

function parseEnvLine(rawLine) {
    const line = String(rawLine || '').trim();
    if (!line || line.startsWith('#')) return null;

    const normalizedLine = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separatorIndex = normalizedLine.indexOf('=');
    if (separatorIndex <= 0) return null;

    const key = normalizedLine.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    return {
        key,
        value: parseEnvValue(rawValue)
    };
}

function parseEnvValue(rawValue) {
    if (!rawValue) return '';

    const quote = rawValue[0];
    if ((quote === '"' || quote === "'") && rawValue.endsWith(quote)) {
        const innerValue = rawValue.slice(1, -1);
        return quote === '"' ? unescapeDoubleQuotedValue(innerValue) : innerValue;
    }

    return stripInlineComment(rawValue).trim();
}

function unescapeDoubleQuotedValue(value) {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function stripInlineComment(value) {
    const commentIndex = value.search(/\s#/);
    return commentIndex >= 0 ? value.slice(0, commentIndex) : value;
}

function get(name, fallback = '') {
    const value = envValues[name];
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getStorageBackedValue(storageKey, envName, fallback = '') {
    const storedValue = storageKey ? localStorage.getItem(storageKey)?.trim() : '';
    if (storedValue) return storedValue;
    return get(envName, fallback);
}

function hasStorageBackedValue(storageKey, envName) {
    return Boolean(getStorageBackedValue(storageKey, envName));
}

function getAiModel(provider) {
    const envNameByProvider = {
        openai: ENV_NAMES.openaiModel,
        anthropic: ENV_NAMES.anthropicModel,
        gemini: ENV_NAMES.geminiModel
    };
    return get(envNameByProvider[provider], DEFAULT_AI_MODELS[provider] || '');
}

function getSpotifyClientId() {
    return get(ENV_NAMES.spotifyClientId, DEFAULT_SPOTIFY_CLIENT_ID);
}

function getLastLoadError() {
    return lastLoadError;
}
})();
