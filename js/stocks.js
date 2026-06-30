// ==========================================
// 株価・市場ウィジェット (Alpha Vantage)
// ==========================================
(function() {
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'IBM'];
const ALPHA_VANTAGE_ENDPOINT = 'https://www.alphavantage.co/query';

let currentStocksData = {};

window.StocksWidget = {
    init,
    initSettings,
    loadStocksData,
    parseDailySeries
};

function init() {
    document.getElementById('stocks-sync-btn')
        ?.addEventListener('click', () => loadStocksData(true));

    initSettings();
    restoreCache();

    if (getApiKey()) {
        loadStocksData();
    } else if (Object.keys(currentStocksData).length === 0) {
        renderApiKeyGuide();
    }
}

function restoreCache() {
    const cached = localStorage.getItem(STORAGE_KEY_STOCKS_CACHE);
    if (!cached) return;

    try {
        currentStocksData = JSON.parse(cached);
        renderStocks();
    } catch (error) {
        console.warn('株価キャッシュを読み取れませんでした。', error);
    }
}

function getApiKey() {
    return localStorage.getItem(STORAGE_KEY_STOCKS_API_KEY)?.trim() || '';
}

function getRegisteredSymbols() {
    const stored = localStorage.getItem(STORAGE_KEY_STOCKS);
    if (!stored) return [...DEFAULT_SYMBOLS];

    try {
        const symbols = JSON.parse(stored);
        return Array.isArray(symbols) ? symbols : [...DEFAULT_SYMBOLS];
    } catch (error) {
        console.warn('登録銘柄を読み取れませんでした。', error);
        return [...DEFAULT_SYMBOLS];
    }
}

function saveRegisteredSymbols(symbols) {
    localStorage.setItem(STORAGE_KEY_STOCKS, JSON.stringify(symbols));
}

async function loadStocksData(force = false) {
    const apiKey = getApiKey();
    if (!apiKey) {
        renderApiKeyGuide();
        window.ApiDiagnostics?.report('stocks', 'missing', 'Alpha Vantage APIキー未設定');
        return;
    }

    const symbols = getRegisteredSymbols();
    if (symbols.length === 0) {
        window.ApiUI.setEmpty('stocks-container', '登録銘柄がありません。設定から追加してください。');
        window.ApiDiagnostics?.report('stocks', 'warning', '登録銘柄がありません');
        return;
    }

    window.ApiUI.setLoading('stocks-container', 'Alpha Vantage から株価を取得中...');

    const results = await Promise.allSettled(
        symbols.map(symbol => fetchStock(symbol, apiKey))
    );

    let succeeded = 0;
    const updatedData = { ...currentStocksData };

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            updatedData[symbols[index]] = result.value;
            succeeded += 1;
        } else {
            console.warn(`株価取得失敗: ${symbols[index]}`, result.reason);
        }
    });

    if (succeeded > 0) {
        currentStocksData = updatedData;
        localStorage.setItem(STORAGE_KEY_STOCKS_CACHE, JSON.stringify(currentStocksData));
        renderStocks();
        window.ApiDiagnostics?.report(
            'stocks',
            succeeded === symbols.length ? 'ok' : 'warning',
            `${succeeded}/${symbols.length}件の株価を更新`
        );
    } else if (Object.keys(currentStocksData).length > 0) {
        renderStocks();
        window.ApiDiagnostics?.report('stocks', 'warning', '株価更新に失敗。キャッシュを表示');
    } else {
        window.ApiUI.setError(
            'stocks-container',
            '株価を取得できませんでした。APIキー、銘柄コード、利用上限を確認してください。'
        );
        window.ApiDiagnostics?.report('stocks', 'error', '株価を取得できませんでした');
    }

    if (succeeded < symbols.length) {
        window.showNotification?.(
            '一部の株価を更新できませんでした。Alpha Vantageの利用上限または銘柄コードを確認してください。',
            'warning'
        );
    } else if (force) {
        window.showNotification?.('株価データを更新しました。', 'success');
    }
}

async function fetchStock(symbol, apiKey) {
    const params = new URLSearchParams({
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact',
        apikey: apiKey
    });
    const response = await fetch(`${ALPHA_VANTAGE_ENDPOINT}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    return parseDailySeries(symbol, payload);
}

// Alpha Vantageの日足レスポンスを、描画に必要な共通形式へ変換する。
function parseDailySeries(requestedSymbol, payload) {
    const providerError = payload?.['Error Message']
        || payload?.Information
        || payload?.Note;
    if (providerError) throw new Error(providerError);

    const series = payload?.['Time Series (Daily)'];
    if (!series || typeof series !== 'object') {
        throw new Error('日足データが含まれていません。');
    }

    const rows = Object.entries(series)
        .map(([date, values]) => ({
            date,
            close: Number(values?.['4. close'])
        }))
        .filter(row => Number.isFinite(row.close))
        .sort((left, right) => left.date.localeCompare(right.date));

    if (rows.length === 0) throw new Error('有効な終値がありません。');

    const currentPrice = rows[rows.length - 1].close;
    const previousPrice = rows.length > 1 ? rows[rows.length - 2].close : currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice === 0 ? 0 : (change / previousPrice) * 100;
    const symbol = payload?.['Meta Data']?.['2. Symbol'] || requestedSymbol;

    return {
        symbol,
        name: symbol,
        price: currentPrice,
        change,
        changePercent,
        currency: inferCurrency(symbol),
        prices: rows.slice(-30).map(row => row.close),
        updatedAt: rows[rows.length - 1].date
    };
}

function inferCurrency(symbol) {
    return /\.(T|TRT|JP)$/i.test(symbol) ? 'JPY' : 'USD';
}

function generateSparklineSvg(prices) {
    if (!prices || prices.length < 2) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 100;
    const height = 28;
    const padding = 2;
    const points = prices.map((price, index) => {
        const x = (index / (prices.length - 1)) * width;
        const y = height - padding - ((price - min) / range) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', prices.at(-1) >= prices[0] ? '#10b981' : '#ef4444');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('points', points);
    svg.appendChild(line);
    return svg;
}

function renderStocks() {
    const container = document.getElementById('stocks-container');
    if (!container) return;

    const list = document.createElement('div');
    list.className = 'stocks-list';

    getRegisteredSymbols().forEach(symbol => {
        const data = currentStocksData[symbol];
        if (!data) return;
        list.appendChild(createStockItem(data));
    });

    if (!list.childElementCount) {
        window.ApiUI.setEmpty('stocks-container', '表示できる株価データがありません。');
        return;
    }

    container.replaceChildren(list);
}

function createStockItem(data) {
    const item = document.createElement('div');
    item.className = 'stock-item';

    const info = document.createElement('div');
    info.className = 'stock-info';
    const symbol = document.createElement('span');
    symbol.className = 'stock-symbol';
    symbol.textContent = data.symbol;
    symbol.title = data.symbol;
    const updated = document.createElement('span');
    updated.className = 'stock-name';
    updated.textContent = data.updatedAt || '';
    info.append(symbol, updated);

    const chart = document.createElement('div');
    chart.className = 'stock-chart';
    const svg = generateSparklineSvg(data.prices);
    if (svg) chart.appendChild(svg);

    const values = document.createElement('div');
    values.className = 'stock-values';
    const price = document.createElement('span');
    price.className = 'stock-price';
    price.textContent = `${getCurrencySymbol(data.currency)}${formatNumber(data.price, data.currency)}`;

    const change = document.createElement('span');
    const statusClass = data.changePercent > 0.005
        ? 'stock-up'
        : data.changePercent < -0.005 ? 'stock-down' : 'stock-flat';
    const prefix = data.changePercent > 0.005 ? '+' : '';
    change.className = `stock-change ${statusClass}`;
    change.textContent = `${prefix}${formatNumber(data.change, data.currency)} (${prefix}${data.changePercent.toFixed(2)}%)`;
    values.append(price, change);

    item.append(info, chart, values);
    return item;
}

function getCurrencySymbol(currency) {
    return currency === 'JPY' ? '¥' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
}

function formatNumber(value, currency) {
    return currency === 'JPY'
        ? Math.round(value).toLocaleString()
        : Number(value).toFixed(2);
}

function renderApiKeyGuide() {
    window.ApiUI.setAuthGuide(
        'stocks-container',
        'Alpha Vantage APIキーが未設定です。設定サイドバーから保存してください。'
    );
}

function initSettings() {
    const apiKeyInput = document.getElementById('stock-api-key');
    const saveApiKeyButton = document.getElementById('save-stock-api-key-btn');
    const symbolInput = document.getElementById('stock-symbol-input');
    const addButton = document.getElementById('add-stock-btn');
    const settingsList = document.getElementById('stock-settings-list');

    if (apiKeyInput) apiKeyInput.value = getApiKey();
    saveApiKeyButton?.addEventListener('click', () => {
        const apiKey = apiKeyInput?.value.trim() || '';
        if (apiKey) {
            localStorage.setItem(STORAGE_KEY_STOCKS_API_KEY, apiKey);
            window.showNotification?.('Alpha Vantage APIキーを保存しました。', 'success');
            loadStocksData(true);
        } else {
            localStorage.removeItem(STORAGE_KEY_STOCKS_API_KEY);
            renderApiKeyGuide();
            window.ApiDiagnostics?.report('stocks', 'missing', 'Alpha Vantage APIキー未設定');
        }
        window.ApiDiagnostics?.refresh?.();
    });

    if (!settingsList) return;

    const renderSettingsList = () => {
        settingsList.replaceChildren();
        const symbols = getRegisteredSymbols();
        if (symbols.length === 0) {
            const empty = document.createElement('li');
            empty.textContent = '登録なし';
            settingsList.appendChild(empty);
            return;
        }

        symbols.forEach((symbol, index) => {
            const item = document.createElement('li');
            item.className = 'stock-setting-item';
            const label = document.createElement('span');
            label.className = 'stock-setting-symbol';
            label.textContent = symbol;
            const deleteButton = document.createElement('button');
            deleteButton.className = 'stock-delete-btn';
            deleteButton.type = 'button';
            deleteButton.title = '削除';
            deleteButton.textContent = '×';
            deleteButton.addEventListener('click', () => {
                const currentSymbols = getRegisteredSymbols();
                currentSymbols.splice(index, 1);
                saveRegisteredSymbols(currentSymbols);
                delete currentStocksData[symbol];
                renderSettingsList();
                renderStocks();
            });
            item.append(label, deleteButton);
            settingsList.appendChild(item);
        });
    };

    const addSymbol = () => {
        const symbol = symbolInput?.value.trim().toUpperCase() || '';
        if (!symbol) return;
        const symbols = getRegisteredSymbols();
        if (symbols.includes(symbol)) {
            window.showNotification?.('既に登録されている銘柄です。', 'warning');
            return;
        }
        symbols.push(symbol);
        saveRegisteredSymbols(symbols);
        symbolInput.value = '';
        renderSettingsList();
        loadStocksData();
    };

    addButton?.addEventListener('click', addSymbol);
    symbolInput?.addEventListener('keypress', event => {
        if (event.key === 'Enter') addSymbol();
    });
    renderSettingsList();
}
})();
