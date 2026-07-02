/**
 * 株価・市場ウィジェット (Google Sheets / GOOGLEFINANCE連携)
 */
(function() {
/** @type {string[]} デフォルトの表示銘柄リスト */
const DEFAULT_SYMBOLS = ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NYSE:IBM'];
/** @type {string} GoogleFinanceのCSV URLを格納する環境変数名 */
const GOOGLEFINANCE_CSV_ENV_NAME = 'NEXUS_GOOGLEFINANCE_CSV_URL';

/** @type {Object<string, string[]>} CSVヘッダーのエイリアスマッピング */
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

/** @type {Object<string, Object>} 現在キャッシュされている株価データ */
let currentStocksData = {};

window.StocksWidget = {
    init,
    initSettings,
    loadStocksData,
    normalizeGoogleFinanceCsvUrl,
    parseGoogleFinanceCsv
};

/**
 * ウィジェットの初期化処理
 */
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

/**
 * ローカルストレージから株価キャッシュを復元する
 */
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

/**
 * 設定されたGoogleFinanceのCSV URLを取得する
 * @returns {string} CSV URL
 */
function getSourceUrl() {
    return window.EnvConfig?.getStorageBackedValue(STORAGE_KEY_STOCKS_SOURCE_URL, GOOGLEFINANCE_CSV_ENV_NAME)
        || localStorage.getItem(STORAGE_KEY_STOCKS_SOURCE_URL)?.trim()
        || '';
}

/**
 * 登録されている銘柄リストを取得する
 * @returns {string[]} 銘柄リスト
 */
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

/**
 * 銘柄リストをローカルストレージに保存する
 * @param {string[]} symbols 銘柄リスト
 */
function saveRegisteredSymbols(symbols) {
    localStorage.setItem(STORAGE_KEY_STOCKS, JSON.stringify(symbols));
}

/**
 * 株価データを取得・更新する
 * @param {boolean} [force=false] 強制更新フラグ
 */
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

/**
 * GoogleFinanceのCSVを取得する
 * @param {string} sourceUrl CSV URL
 * @returns {Promise<Object[]>} 解析済みの株価データ配列
 */
async function fetchStocksFromGoogleFinance(sourceUrl) {
    const response = await fetch(normalizeGoogleFinanceCsvUrl(sourceUrl), { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    return parseGoogleFinanceCsv(csvText);
}

/**
 * 株価取得失敗時のエラー表示とキャッシュのフォールバックを行う
 * @param {string} message エラーメッセージ
 */
function renderFetchFailure(message) {
    if (Object.keys(currentStocksData).length > 0) {
        renderStocks();
        window.ApiDiagnostics?.report('stocks', 'warning', '株価更新に失敗。キャッシュを表示');
        return;
    }

    window.ApiUI.setError('stocks-container', message);
    window.ApiDiagnostics?.report('stocks', 'error', '株価を取得できませんでした');
}

/**
 * Google SheetsのURLをCSV出力用のURLに正規化する
 * @param {string} input 入力されたURL
 * @returns {string} 正規化されたCSV URL
 */
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

/**
 * CSVテキストをパースして株価データオブジェクトの配列に変換する
 * @param {string} csvText CSV文字列
 * @returns {Object[]} パース済みの株価データ配列
 */
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

/**
 * CSV文字列を行とセルに分割する
 * @param {string} csvText CSV文字列
 * @returns {string[][]} セル単位に分割された2次元配列
 */
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

/**
 * ヘッダー行から各列のインデックスマップを作成する
 * @param {string[]} headerRow ヘッダー行の配列
 * @returns {Object<string, number>} ヘッダーインデックス
 */
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

/**
 * 個別の株価データ行をパースする
 * @param {string[]} row データ行
 * @param {Object} indexes ヘッダーインデックス
 * @returns {Object|null} 株価データオブジェクト
 */
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

/**
 * 行から指定インデックスのセル値を取得する
 * @param {string[]} row データ行
 * @param {number|undefined} index 列インデックス
 * @returns {string} セルの値
 */
function getCell(row, index) {
    return index === undefined ? '' : String(row[index] || '').trim();
}

/**
 * ヘッダー文字列を正規化（小文字化・空白等の除去）する
 * @param {string} header ヘッダー文字列
 * @returns {string} 正規化されたヘッダー
 */
function normalizeHeader(header) {
    return String(header || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_\-（）()]/g, '');
}

/**
 * 任意の数値をパースする（失敗時はNaN）
 * @param {string|number} value 対象の値
 * @returns {number} パースされた数値またはNaN
 */
function parseOptionalNumber(value) {
    const parsed = parseNumber(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * 通貨記号などを除去して数値をパースする
 * @param {string|number} value 対象の値
 * @returns {number} パースされた数値またはNaN
 */
function parseNumber(value) {
    const normalized = String(value || '')
        .replace(/[,%$¥€£]/g, '')
        .trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

/**
 * 騰落率から価格変動額を計算する
 * @param {number} price 現在の価格
 * @param {number} changePercent 騰落率（%）
 * @returns {number} 価格変動額
 */
function calculateChangeFromPercent(price, changePercent) {
    if (!Number.isFinite(changePercent)) return 0;
    const previousPrice = price / (1 + (changePercent / 100));
    return price - previousPrice;
}

/**
 * 価格変動額から騰落率を計算する
 * @param {number} price 現在の価格
 * @param {number} change 価格変動額
 * @returns {number} 騰落率（%）
 */
function calculateChangePercent(price, change) {
    if (!Number.isFinite(change) || change === 0) return 0;
    const previousPrice = price - change;
    return previousPrice === 0 ? 0 : (change / previousPrice) * 100;
}

/**
 * 履歴データをパースして価格配列を生成する
 * @param {string} value 履歴データの文字列
 * @param {number} fallbackPrice データ不足時のフォールバック価格
 * @returns {number[]} 価格配列
 */
function parsePrices(value, fallbackPrice) {
    const prices = String(value || '')
        .split(/[;|\s]+/)
        .map(parseNumber)
        .filter(Number.isFinite);
    return prices.length >= 2 ? prices.slice(-30) : [fallbackPrice, fallbackPrice];
}

/**
 * 株価データ配列から指定の銘柄を検索する
 * @param {Object[]} stocks 株価データ配列
 * @param {string} requestedSymbol 要求された銘柄シンボル
 * @returns {Object|undefined} 株価データ
 */
function findStockData(stocks, requestedSymbol) {
    const requestedKeys = createSymbolKeys(requestedSymbol);
    return stocks.find(stock => {
        const stockKeys = createSymbolKeys(stock.symbol);
        return requestedKeys.some(key => stockKeys.includes(key));
    });
}

/**
 * 銘柄シンボルから検索用のキー配列を生成する
 * @param {string} symbol 銘柄シンボル
 * @returns {string[]} キー配列
 */
function createSymbolKeys(symbol) {
    const normalized = String(symbol || '').trim().toUpperCase();
    const withoutExchange = normalized.includes(':') ? normalized.split(':').at(-1) : normalized;
    return [...new Set([normalized, withoutExchange])].filter(Boolean);
}

/**
 * 銘柄シンボルから通貨を推測する
 * @param {string} symbol 銘柄シンボル
 * @returns {string} 推測される通貨コード
 */
function inferCurrency(symbol) {
    return /(^TYO:|\.T$|\.JP$)/i.test(symbol) ? 'JPY' : 'USD';
}

/**
 * 価格履歴からスパークライン（簡易チャート）用のSVG要素を生成する
 * @param {number[]} prices 価格配列
 * @returns {SVGElement|null} SVG要素
 */
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

/**
 * 株価ウィジェットのUIをレンダリングする
 */
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

/**
 * 1銘柄分の表示要素を生成する
 * @param {Object} data 株価データ
 * @returns {Element} 銘柄項目の要素
 */
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

/**
 * 通貨コードから通貨記号を取得する
 * @param {string} currency 通貨コード
 * @returns {string} 通貨記号
 */
function getCurrencySymbol(currency) {
    return currency === 'JPY' ? '¥' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
}

/**
 * 通貨に応じた数値のフォーマットを行う
 * @param {number} value 数値
 * @param {string} currency 通貨コード
 * @returns {string} フォーマットされた文字列
 */
function formatNumber(value, currency) {
    return currency === 'JPY'
        ? Math.round(value).toLocaleString()
        : Number(value).toFixed(2);
}

/**
 * 設定ガイドUIをレンダリングする
 */
function renderSourceGuide() {
    window.ApiUI.setAuthGuide(
        'stocks-container',
        'GoogleFinance の計算結果を含む Google Sheets の公開CSV URLを設定してください。'
    );
}

/**
 * 株価ウィジェットの設定UIを初期化する
 */
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
