// ==========================================
// 株価・市場ウィジェット
// ==========================================
(function() {
const STORAGE_KEY_STOCKS = 'custom_stock_symbols';
const STORAGE_KEY_STOCKS_CACHE = 'custom_stocks_cache';
const DEFAULT_SYMBOLS = ['^N225', 'AAPL', '7203.T'];

let currentStocksData = {};

window.StocksWidget = {
    init,
    initSettings,
    loadStocksData
};

function init() {
    const syncBtn = document.getElementById('stocks-sync-btn');
    syncBtn?.addEventListener('click', () => loadStocksData(true));

    initSettings();

    // キャッシュの読み込み
    const cached = localStorage.getItem(STORAGE_KEY_STOCKS_CACHE);
    if (cached) {
        try {
            currentStocksData = JSON.parse(cached);
            renderStocks();
        } catch(e) {
            console.warn("Stocks cache parse failed", e);
        }
    }

    loadStocksData();
}

// 登録されているシンボルの取得
function getRegisteredSymbols() {
    const stored = localStorage.getItem(STORAGE_KEY_STOCKS);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) {
            console.warn("Failed to parse stock symbols", e);
        }
    }
    return DEFAULT_SYMBOLS;
}

// シンボルの保存
function saveRegisteredSymbols(symbols) {
    localStorage.setItem(STORAGE_KEY_STOCKS, JSON.stringify(symbols));
}

// Yahoo Finance からデータを取得
async function loadStocksData(force = false) {
    const symbols = getRegisteredSymbols();
    if (symbols.length === 0) {
        renderEmpty();
        return;
    }

    setLoading(true);

    const newData = {};
    let hasError = false;

    // 各シンボルのデータを並行してフェッチ
    const fetchPromises = symbols.map(async (symbol) => {
        try {
            // 直近1ヶ月、1日足でデータを取得
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const result = data.chart?.result?.[0];
            if (!result) throw new Error("Invalid response format");

            const meta = result.meta || {};
            const quote = result.indicators?.quote?.[0] || {};
            const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];
            
            // 終値配列（null値を除外・補間するための処理）
            let prices = adjclose.length > 0 ? adjclose : (quote.close || []);
            prices = prices.filter(p => p !== null && p !== undefined);

            const currentPrice = meta.regularMarketPrice ?? (prices[prices.length - 1] || 0);
            const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? (prices[0] || currentPrice);
            const change = currentPrice - prevClose;
            const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

            newData[symbol] = {
                symbol: meta.symbol || symbol,
                name: meta.shortName || meta.longName || meta.symbol || symbol,
                price: currentPrice,
                change: change,
                changePercent: changePercent,
                currency: meta.currency || '',
                prices: prices
            };
        } catch (e) {
            console.error(`Failed to fetch stock data for ${symbol}:`, e);
            hasError = true;
            // エラー時でも既存のキャッシュがあれば残す
            if (currentStocksData[symbol]) {
                newData[symbol] = currentStocksData[symbol];
            }
        }
    });

    await Promise.all(fetchPromises);

    currentStocksData = newData;
    localStorage.setItem(STORAGE_KEY_STOCKS_CACHE, JSON.stringify(currentStocksData));
    
    setLoading(false);
    renderStocks();

    if (hasError) {
        if (Object.keys(currentStocksData).length > 0) {
            window.showNotification?.("一部の株価データの取得に失敗しました。キャッシュを表示しています。", "warning");
        } else {
            renderError("株価データの取得に失敗しました。ネットワーク状況を確認してください。");
        }
    } else if (force) {
        window.showNotification?.("株価データを更新しました。", "success");
    }
}

// SVGスパークライン（ミニチャート）の生成
function generateSparklineSvg(prices) {
    if (!prices || prices.length < 2) return '';

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;

    const width = 100;
    const height = 28;
    const padding = 2;

    const points = prices.map((price, index) => {
        const x = (index / (prices.length - 1)) * width;
        const y = height - padding - ((price - min) / range) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] >= prices[0];
    const strokeColor = isUp ? '#10b981' : '#ef4444'; // CSSカラーコード直接指定

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <polyline fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
    </svg>`;
}

// 通貨記号の取得
function getCurrencySymbol(currency) {
    switch (currency?.toUpperCase()) {
        case 'USD': return '$';
        case 'JPY': return '¥';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '';
    }
}

// データの描画
function renderStocks() {
    const container = document.getElementById('stocks-container');
    if (!container) return;

    container.innerHTML = '';
    
    const symbols = getRegisteredSymbols();
    if (symbols.length === 0) {
        renderEmpty();
        return;
    }

    const list = document.createElement('div');
    list.className = 'stocks-list';

    let hasData = false;

    symbols.forEach(symbol => {
        const data = currentStocksData[symbol];
        if (!data) return;

        hasData = true;
        const item = document.createElement('div');
        item.className = 'stock-item';

        // 騰落率のステータスクラス
        let statusClass = 'stock-flat';
        let prefix = '';
        if (data.changePercent > 0.005) {
            statusClass = 'stock-up';
            prefix = '+';
        } else if (data.changePercent < -0.005) {
            statusClass = 'stock-down';
        }

        // 小数点以下の表示桁数調整
        const isYen = data.currency?.toUpperCase() === 'JPY';
        const priceFormatted = isYen ? Math.round(data.price).toLocaleString() : data.price.toFixed(2);
        const changeFormatted = isYen ? Math.round(data.change).toLocaleString() : data.change.toFixed(2);
        const curSymbol = getCurrencySymbol(data.currency);

        item.innerHTML = `
            <div class="stock-info">
                <span class="stock-symbol" title="${data.symbol}">${data.symbol}</span>
                <span class="stock-name" title="${data.name}">${data.name}</span>
            </div>
            <div class="stock-chart">
                ${generateSparklineSvg(data.prices)}
            </div>
            <div class="stock-values">
                <span class="stock-price">${curSymbol}${priceFormatted}</span>
                <span class="stock-change ${statusClass}">${prefix}${changeFormatted} (${prefix}${data.changePercent.toFixed(2)}%)</span>
            </div>
        `;

        list.appendChild(item);
    });

    if (!hasData) {
        container.innerHTML = '<div class="loading">株価データをロード中...</div>';
    } else {
        container.appendChild(list);
    }
}

function renderEmpty() {
    const container = document.getElementById('stocks-container');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <p>登録されている銘柄はありません。設定からシンボルを追加してください。</p>
        </div>
    `;
}

function renderError(message) {
    const container = document.getElementById('stocks-container');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state error-state">
            <span>⚠️</span>
            <p>${message}</p>
        </div>
    `;
}

function setLoading(isLoading) {
    const container = document.getElementById('stocks-container');
    if (!container) return;
    
    // すでにリストがある場合はローディングを上書きせず、最小限のインジケータ（必要なら）にする
    if (isLoading && !container.querySelector('.stocks-list')) {
        container.innerHTML = '<div class="loading">最新データを取得中...</div>';
    }
}

// 設定画面の初期化
function initSettings() {
    const symbolInput = document.getElementById('stock-symbol-input');
    const addBtn = document.getElementById('add-stock-btn');
    const settingsList = document.getElementById('stock-settings-list');

    if (!settingsList) return;

    // リストの描画
    const renderSettingsList = () => {
        settingsList.innerHTML = '';
        const symbols = getRegisteredSymbols();
        
        if (symbols.length === 0) {
            settingsList.innerHTML = '<li style="color:#94a3b8; font-size:0.85rem; padding:4px;">登録なし</li>';
            return;
        }

        symbols.forEach((symbol, index) => {
            const li = document.createElement('li');
            li.className = 'stock-setting-item';
            
            const span = document.createElement('span');
            span.className = 'stock-setting-symbol';
            span.textContent = symbol;

            const delBtn = document.createElement('button');
            delBtn.className = 'stock-delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.title = '削除';
            delBtn.addEventListener('click', () => {
                const currentSymbols = getRegisteredSymbols();
                currentSymbols.splice(index, 1);
                saveRegisteredSymbols(currentSymbols);
                renderSettingsList();
                loadStocksData();
            });

            li.append(span, delBtn);
            settingsList.appendChild(li);
        });
    };

    renderSettingsList();

    // 銘柄追加イベント
    const addSymbolAction = () => {
        if (!symbolInput) return;
        const val = symbolInput.value.trim().toUpperCase();
        if (!val) return;

        const currentSymbols = getRegisteredSymbols();
        if (currentSymbols.includes(val)) {
            window.showNotification?.("既に登録されているシンボルです。", "warning");
            return;
        }

        // 追加
        currentSymbols.push(val);
        saveRegisteredSymbols(currentSymbols);
        symbolInput.value = '';
        renderSettingsList();
        loadStocksData();
    };

    addBtn?.addEventListener('click', addSymbolAction);
    symbolInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addSymbolAction();
        }
    });
}
})();
