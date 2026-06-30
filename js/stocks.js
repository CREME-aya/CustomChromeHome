// ==========================================
// 株価・市場ウィジェット (Google Sheets / GOOGLEFINANCE)
// ==========================================
(function() {
const DEFAULT_SYMBOLS = ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NYSE:IBM'];
const GOOGLEFINANCE_CSV_ENV_NAME = 'NEXUS_GOOGLEFINANCE_CSV_URL';

const HEADER_ALIASES = {
    symbol: ['symbol', 'ticker', 'code', '銘柄', 'シンボル', 'ティッカー'],
    name: ['name', 'company', '銘柄名', '名称', '名前'],
    price: ['price', 'current', 'currentprice', 'last', '現在値', '価格', '株価'],
    change: ['change', 'pricechange', 'chg', '前日比', '変化'],
    changePercent: ['changepct', 'changepercent', 'change%', 'chg%', '前日比率', '騰落率'],
    currency: ['currency', '通貨'],
    updatedAt: ['updatedat', 'updated', 'tradetime', 'time', '更新日時', '取引日時'],
    prices: ['prices', 'history', 'sparkline', '履歴', '推移']
};

let currentStocksData = {};

window.StocksWidget = {
    init,
    initSettings,
    loadStocksData,
    normalizeGoogleFinanceCsvUrl,
    parseGoogleFinanceCsv
};

function init() {
    document.getElementById('stocks-sync-btn')
        ?.addEventListener('click', () => loadStocksData(true));

    initSettings();
    restoreCache();

    if (getSourceUrl()) {
        loadStocksData();
    } else if (Object.keys(currentStocksData).length === 0) {
        renderSourceGuide();
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

function getSourceUrl() {
    return window.EnvConfig?.getStorageBackedValue(STORAGE_KEY_STOCKS_SOURCE_URL, GOOGLEFINANCE_CSV_ENV_NAME)
        || localStorage.getItem(STORAGE_KEY_STOCKS_SOURCE_URL)?.trim()
        || '';
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
    const sourceUrl = getSourceUrl();
    if (!sourceUrl) {
        renderSourceGuide();
        window.ApiDiagnostics?.report('stocks', 'missing', 'GoogleFinance CSV URL 未設定');
        return;
    }

    const symbols = getRegisteredSymbols();
    if (symbols.length === 0) {
        window.ApiUI.setEmpty('stocks-container', '登録銘柄がありません。設定から追加してください。');
        window.ApiDiagnostics?.report('stocks', 'warning', '登録銘柄がありません');
        return;
    }

    window.ApiUI.setLoading('stocks-container', 'Google Sheets から株価を取得中...');

    try {
        const fetchedData = await fetchStocksFromGoogleFinance(sourceUrl);
        const updatedData = { ...currentStocksData };
        let succeeded = 0;

        symbols.forEach((symbol) => {
            const data = findStockData(fetchedData, symbol);
            if (!data) {
                console.warn(`GoogleFinance CSVに銘柄が見つかりません: ${symbol}`);
                return;
            }
            updatedData[symbol] = data;
            succeeded += 1;
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
        } else {
            renderFetchFailure('GoogleFinance CSVに登録銘柄のデータがありません。');
        }

        if (succeeded < symbols.length) {
            window.showNotification?.(
                '一部の株価を更新できませんでした。Google Sheetsの銘柄行と登録銘柄を確認してください。',
                'warning'
            );
        } else if (force) {
            window.showNotification?.('株価データを更新しました。', 'success');
        }
    } catch (error) {
        console.warn('株価取得失敗:', error);
        renderFetchFailure('株価を取得できませんでした。Google Sheetsの公開設定とCSV URLを確認してください。');
    }
}

async function fetchStocksFromGoogleFinance(sourceUrl) {
    const response = await fetch(normalizeGoogleFinanceCsvUrl(sourceUrl), { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    return parseGoogleFinanceCsv(csvText);
}

function renderFetchFailure(message) {
    if (Object.keys(currentStocksData).length > 0) {
        renderStocks();
        window.ApiDiagnostics?.report('stocks', 'warning', '株価更新に失敗。キャッシュを表示');
        return;
    }

    window.ApiUI.setError('stocks-container', message);
    window.ApiDiagnostics?.report('stocks', 'error', '株価を取得できませんでした');
}

function normalizeGoogleFinanceCsvUrl(input) {
    const rawUrl = String(input || '').trim();
    if (!rawUrl) return '';

    try {
        const url = new URL(rawUrl);
        if (url.hostname !== 'docs.google.com') return rawUrl;
        if (!url.pathname.includes('/spreadsheets/')) return rawUrl;
        if (url.searchParams.get('output') === 'csv' || url.searchParams.get('tqx') === 'out:csv') {
            return rawUrl;
        }

        const gid = url.searchParams.get('gid') || new URLSearchParams(url.hash.replace(/^#/, '')).get('gid') || '0';
        const publishedMatch = url.pathname.match(/\/spreadsheets\/d\/e\/([^/]+)/);
        if (publishedMatch) {
            const csvUrl = new URL(`https://docs.google.com/spreadsheets/d/e/${publishedMatch[1]}/pub`);
            csvUrl.searchParams.set('gid', gid);
            csvUrl.searchParams.set('single', 'true');
            csvUrl.searchParams.set('output', 'csv');
            return csvUrl.toString();
        }

        const sheetMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
        if (!sheetMatch) return rawUrl;

        const csvUrl = new URL(`https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/gviz/tq`);
        csvUrl.searchParams.set('tqx', 'out:csv');
        csvUrl.searchParams.set('gid', gid);
        return csvUrl.toString();
    } catch (error) {
        return rawUrl;
    }
}

function parseGoogleFinanceCsv(csvText) {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) throw new Error('CSVにデータ行がありません。');

    const headerIndexes = createHeaderIndexes(rows[0]);
    if (headerIndexes.symbol === undefined || headerIndexes.price === undefined) {
        throw new Error('CSVには symbol と price 列が必要です。');
    }

    return rows.slice(1)
        .map(row => parseStockRow(row, headerIndexes))
        .filter(Boolean);
}

function parseCsvRows(csvText) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < String(csvText || '').length; index += 1) {
        const char = csvText[index];
        const nextChar = csvText[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            cell += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') index += 1;
            row.push(cell);
            if (row.some(value => value.trim() !== '')) rows.push(row);
            row = [];
            cell = '';
            continue;
        }

        cell += char;
    }

    row.push(cell);
    if (row.some(value => value.trim() !== '')) rows.push(row);
    return rows;
}

function createHeaderIndexes(headerRow) {
    return headerRow.reduce((indexes, header, index) => {
        const normalizedHeader = normalizeHeader(header);
        Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
            if (indexes[field] === undefined && aliases.includes(normalizedHeader)) {
                indexes[field] = index;
            }
        });
        return indexes;
    }, {});
}

function parseStockRow(row, indexes) {
    const symbol = getCell(row, indexes.symbol).toUpperCase();
    const price = parseNumber(getCell(row, indexes.price));
    if (!symbol || !Number.isFinite(price)) return null;

    const change = parseOptionalNumber(getCell(row, indexes.change));
    const changePercent = parseOptionalNumber(getCell(row, indexes.changePercent));
    const normalizedChange = Number.isFinite(change)
        ? change
        : calculateChangeFromPercent(price, changePercent);
    const normalizedChangePercent = Number.isFinite(changePercent)
        ? changePercent
        : calculateChangePercent(price, normalizedChange);
    const prices = parsePrices(getCell(row, indexes.prices), price);

    return {
        symbol,
        name: getCell(row, indexes.name) || symbol,
        price,
        change: normalizedChange,
        changePercent: normalizedChangePercent,
        currency: getCell(row, indexes.currency) || inferCurrency(symbol),
        prices,
        updatedAt: getCell(row, indexes.updatedAt)
    };
}

function getCell(row, index) {
    return index === undefined ? '' : String(row[index] || '').trim();
}

function normalizeHeader(header) {
    return String(header || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_\-（）()]/g, '');
}

function parseOptionalNumber(value) {
    const parsed = parseNumber(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function parseNumber(value) {
    const normalized = String(value || '')
        .replace(/[,%$¥€£]/g, '')
        .trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

function calculateChangeFromPercent(price, changePercent) {
    if (!Number.isFinite(changePercent)) return 0;
    const previousPrice = price / (1 + (changePercent / 100));
    return price - previousPrice;
}

function calculateChangePercent(price, change) {
    if (!Number.isFinite(change) || change === 0) return 0;
    const previousPrice = price - change;
    return previousPrice === 0 ? 0 : (change / previousPrice) * 100;
}

function parsePrices(value, fallbackPrice) {
    const prices = String(value || '')
        .split(/[;|\s]+/)
        .map(parseNumber)
        .filter(Number.isFinite);
    return prices.length >= 2 ? prices.slice(-30) : [fallbackPrice, fallbackPrice];
}

function findStockData(stocks, requestedSymbol) {
    const requestedKeys = createSymbolKeys(requestedSymbol);
    return stocks.find(stock => {
        const stockKeys = createSymbolKeys(stock.symbol);
        return requestedKeys.some(key => stockKeys.includes(key));
    });
}

function createSymbolKeys(symbol) {
    const normalized = String(symbol || '').trim().toUpperCase();
    const withoutExchange = normalized.includes(':') ? normalized.split(':').at(-1) : normalized;
    return [...new Set([normalized, withoutExchange])].filter(Boolean);
}

function inferCurrency(symbol) {
    return /(^TYO:|\.T$|\.JP$)/i.test(symbol) ? 'JPY' : 'USD';
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
    updated.textContent = data.updatedAt || data.name || '';
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

function renderSourceGuide() {
    window.ApiUI.setAuthGuide(
        'stocks-container',
        'GoogleFinance の計算結果を含む Google Sheets の公開CSV URLを設定してください。'
    );
}

function initSettings() {
    const sourceInput = document.getElementById('stock-source-url');
    const saveSourceButton = document.getElementById('save-stock-source-btn');
    const symbolInput = document.getElementById('stock-symbol-input');
    const addButton = document.getElementById('add-stock-btn');
    const settingsList = document.getElementById('stock-settings-list');

    if (sourceInput) sourceInput.value = getSourceUrl();
    saveSourceButton?.addEventListener('click', () => {
        const sourceUrl = sourceInput?.value.trim() || '';
        if (sourceUrl) {
            localStorage.setItem(STORAGE_KEY_STOCKS_SOURCE_URL, sourceUrl);
            window.showNotification?.('GoogleFinance CSV URLを保存しました。', 'success');
            loadStocksData(true);
        } else {
            localStorage.removeItem(STORAGE_KEY_STOCKS_SOURCE_URL);
            renderSourceGuide();
            window.ApiDiagnostics?.report('stocks', 'missing', 'GoogleFinance CSV URL 未設定');
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
