// ==========================================
// Open-Meteo APIから天気・降水確率情報を取得して描画する
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initWeatherSettings = initWeatherSettings;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.loadWeather = loadWeather;
window.WeatherCore = {
    buildWeatherSearchQueries
};

// 詳細: 関数「loadWeather」の処理ブロックを開始する。
async function loadWeather() {
    // 詳細: 変数「weatherWidget」を、この後の処理で使う値として用意する。
    const weatherWidget = document.getElementById('weather-widget');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!weatherWidget) return;

    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 詳細: 変数「location」を、この後の処理で使う値として用意する。
        const location = getStoredWeatherLocation();
        // 保存済み位置をOpen-Meteoの予報APIへ渡し、現在天気と降水確率をまとめて取得する。
        // 詳細: 変数「meteoRes」を、この後の処理で使う値として用意する。
        const meteoRes = await fetch(buildWeatherForecastUrl(location));
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!meteoRes.ok) throw new Error('HTTP Error');
        // 詳細: 変数「meteoData」を、この後の処理で使う値として用意する。
        const meteoData = await meteoRes.json();
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        weatherWidget.innerHTML = renderWeatherWidget(location.name, meteoData);
        window.ApiDiagnostics?.report('weather', 'ok', `${location.name} の天気取得に成功`);
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch (e) {
        // 詳細: 調査や失敗確認のため、実行時情報をコンソールへ出力する。
        console.error(e);
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        weatherWidget.innerHTML = '<div class="weather-error">天気情報の取得に失敗しました</div>';
        window.ApiDiagnostics?.report('weather', 'error', '天気情報の取得に失敗');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「initWeatherSettings」の処理ブロックを開始する。
function initWeatherSettings() {
    // 詳細: 変数「cityInput」を、この後の処理で使う値として用意する。
    const cityInput = document.getElementById('weather-city-input');
    // 詳細: 変数「cityButton」を、この後の処理で使う値として用意する。
    const cityButton = document.getElementById('weather-city-btn');
    // 詳細: 変数「status」を、この後の処理で使う値として用意する。
    const status = document.getElementById('weather-city-status');

    // 詳細: 次の処理行「updateWeatherCityStatus(status);」の役割を、その場の制御フローに組み込む。
    updateWeatherCityStatus(status);

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (cityButton && cityInput) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        cityButton.addEventListener('click', () => handleWeatherCitySearch(cityInput, status));
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「updateWeatherCityStatus」の処理ブロックを開始する。
function updateWeatherCityStatus(status) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!status) return;
    // 詳細: 画面に表示するテキストを安全に更新する。
    status.textContent = `現在: ${getStoredWeatherLocation().name}`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「resetWeatherCityStatus」の処理ブロックを開始する。
function resetWeatherCityStatus(status) {
    // 詳細: 指定時間だけ待ってから、後続の処理を実行する。
    setTimeout(() => updateWeatherCityStatus(status), WEATHER_STATUS_RESET_DELAY_MS);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「handleWeatherCitySearch」の処理ブロックを開始する。
async function handleWeatherCitySearch(input, status) {
    // 詳細: 変数「query」を、この後の処理で使う値として用意する。
    const query = input.value.trim();
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!query) return;

    // 詳細: 次の処理行「setWeatherStatus(status, '検索中...');」の役割を、その場の制御フローに組み込む。
    setWeatherStatus(status, '検索中...');
    // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
    try {
        // 都市名は緯度経度へ変換してから、以後の天気取得に使う。
        // 詳細: 変数「location」を、この後の処理で使う値として用意する。
        const location = await fetchWeatherLocationByCity(query);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!location) {
            // 詳細: 次の処理行「setWeatherStatus(status, '見つかりませんでした');」の役割を、その場の制御フローに組み込む。
            setWeatherStatus(status, '見つかりませんでした');
            // 詳細: 次の処理行「resetWeatherCityStatus(status);」の役割を、その場の制御フローに組み込む。
            resetWeatherCityStatus(status);
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「saveWeatherLocation(location);」の役割を、その場の制御フローに組み込む。
        saveWeatherLocation(location);
        // 詳細: 次の処理行「input.value = '';」の役割を、その場の制御フローに組み込む。
        input.value = '';
        // 詳細: 次の処理行「updateWeatherCityStatus(status);」の役割を、その場の制御フローに組み込む。
        updateWeatherCityStatus(status);
        // 詳細: 次の処理行「loadWeather();」の役割を、その場の制御フローに組み込む。
        loadWeather();
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    } catch (e) {
        // 詳細: 次の処理行「setWeatherStatus(status, 'エラーが発生しました');」の役割を、その場の制御フローに組み込む。
        setWeatherStatus(status, 'エラーが発生しました');
        // 詳細: 次の処理行「resetWeatherCityStatus(status);」の役割を、その場の制御フローに組み込む。
        resetWeatherCityStatus(status);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「setWeatherStatus」の処理ブロックを開始する。
function setWeatherStatus(status, message) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (status) status.textContent = message;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「fetchWeatherLocationByCity」の処理ブロックを開始する。
async function fetchWeatherLocationByCity(query) {
    // 「渋谷区」のような行政区名で見つからない場合は「渋谷」へ縮めて再検索する。
    let result = null;
    for (const candidate of buildWeatherSearchQueries(query)) {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=ja&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
        const data = await res.json();
        result = data.results?.[0] || null;
        if (result) break;
    }

    if (!result) return null;

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: オブジェクトのプロパティ値を定義する。
        lat: String(result.latitude),
        // 詳細: オブジェクトのプロパティ値を定義する。
        lon: String(result.longitude),
        // 詳細: 次の処理行「name: result.name + (result.admin1 ? バッククォート, ${result.admin1}バッククォート : '')」の役割を、その場の制御フローに組み込む。
        name: result.name + (result.admin1 ? `, ${result.admin1}` : '')
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

function buildWeatherSearchQueries(query) {
    const normalized = String(query || '').trim();
    if (!normalized) return [];

    const simplified = normalized.replace(/(?:都|道|府|県|市|区|町|村)$/u, '').trim();
    return simplified && simplified !== normalized
        ? [normalized, simplified]
        : [normalized];
}

// 詳細: 関数「saveWeatherLocation」の処理ブロックを開始する。
function saveWeatherLocation({ lat, lon, name }) {
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(WEATHER_STORAGE_KEYS.lat, lat);
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(WEATHER_STORAGE_KEYS.lon, lon);
    // 詳細: ユーザー設定や状態を localStorage に保存する。
    localStorage.setItem(WEATHER_STORAGE_KEYS.name, name);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getStoredWeatherLocation」の処理ブロックを開始する。
function getStoredWeatherLocation() {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        lat: localStorage.getItem(WEATHER_STORAGE_KEYS.lat) || DEFAULT_WEATHER_LOCATION.lat,
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        lon: localStorage.getItem(WEATHER_STORAGE_KEYS.lon) || DEFAULT_WEATHER_LOCATION.lon,
        // 詳細: 保存済みのユーザー設定や状態を localStorage から読み取る。
        name: localStorage.getItem(WEATHER_STORAGE_KEYS.name) || DEFAULT_WEATHER_LOCATION.name
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「buildWeatherForecastUrl」の処理ブロックを開始する。
function buildWeatherForecastUrl({ lat, lon }) {
    // Chrome新規タブで使うため、タイムゾーンは日本時間に固定する。
    // 詳細: 変数「params」を、この後の処理で使う値として用意する。
    const params = new URLSearchParams({
        // 詳細: オブジェクトのプロパティ値を定義する。
        latitude: lat,
        // 詳細: オブジェクトのプロパティ値を定義する。
        longitude: lon,
        // 詳細: オブジェクトのプロパティ値を定義する。
        current_weather: 'true',
        // 詳細: オブジェクトのプロパティ値を定義する。
        hourly: 'precipitation_probability',
        // 詳細: オブジェクトのプロパティ値を定義する。
        timezone: 'Asia/Tokyo',
        // 詳細: 次の処理行「models: 'jma_seamless'」の役割を、その場の制御フローに組み込む。
        models: 'jma_seamless'
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「renderWeatherWidget」の処理ブロックを開始する。
function renderWeatherWidget(locationName, meteoData) {
    // 詳細: 変数「current」を、この後の処理で使う値として用意する。
    const current = meteoData.current_weather;
    // 詳細: 変数「weather」を、この後の処理で使う値として用意する。
    const weather = WMO_WEATHER[current.weathercode] || { emoji: '🌡️', text: '不明' };
    // 詳細: 変数「chartHTML」を、この後の処理で使う値として用意する。
    const chartHTML = renderWeatherChart(
        // 詳細: 次の処理行「meteoData.hourly.time,」の役割を、その場の制御フローに組み込む。
        meteoData.hourly.time,
        // 詳細: 次の処理行「meteoData.hourly.precipitation_probability」の役割を、その場の制御フローに組み込む。
        meteoData.hourly.precipitation_probability
    // 詳細: 次の処理行「);」の役割を、その場の制御フローに組み込む。
    );

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `
        <div style="display:flex; align-items:center; gap: 16px;">
            <div class="weather-icon-container">${weather.emoji}</div>
            <div class="weather-info">
                <div class="weather-area">${formatWeatherLocationName(locationName)}</div>
                <div class="weather-temp-container">
                    <span class="weather-desc">${weather.text}</span>
                    <span class="weather-rain" style="margin-left: 8px;">${current.temperature}℃</span>
                </div>
            </div>
        </div>
        ${chartHTML}
    `;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「renderWeatherChart」の処理ブロックを開始する。
function renderWeatherChart(times, precipitationProbabilities) {
    // 詳細: 変数「startIndex」を、この後の処理で使う値として用意する。
    const startIndex = findForecastStartIndex(times);
    // 詳細: 変数「chartItems」を、この後の処理で使う値として用意する。
    const chartItems = [];

    // 現在時刻に近い予報から数時間分だけを小さな棒グラフで表示する。
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    for (let i = 0; i < WEATHER_CHART_HOURS; i++) {
        // 詳細: 変数「index」を、この後の処理で使う値として用意する。
        const index = startIndex + i;
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (index >= times.length) break;

        // 詳細: 変数「probability」を、この後の処理で使う値として用意する。
        const probability = precipitationProbabilities[index] || 0;
        // 詳細: 変数「hour」を、この後の処理で使う値として用意する。
        const hour = new Date(times[index]).getHours().toString().padStart(2, '0');
        // 詳細: 変数「height」を、この後の処理で使う値として用意する。
        const height = getWeatherChartBarHeight(probability);
        // 詳細: 変数「opacity」を、この後の処理で使う値として用意する。
        const opacity = probability > 0 ? 1 : 0.3;

        // 詳細: 次の処理行「chartItems.push(バッククォート」の役割を、その場の制御フローに組み込む。
        chartItems.push(`
            <div class="weather-chart-bar-wrap">
                <span class="weather-chart-val">${probability}</span>
                <div class="weather-chart-bar" style="height: ${height}px; opacity: ${opacity};"></div>
                <span class="weather-chart-label">${hour}</span>
            </div>
        `);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `<div class="weather-chart-container">${chartItems.join('')}</div>`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「findForecastStartIndex」の処理ブロックを開始する。
function findForecastStartIndex(times) {
    // APIの時刻配列が現在時刻より少し前から始まるケースを吸収する。
    // 詳細: 変数「oneHourAgo」を、この後の処理で使う値として用意する。
    const oneHourAgo = Date.now() - 3600000;
    // 詳細: 変数「index」を、この後の処理で使う値として用意する。
    const index = times.findIndex(time => new Date(time).getTime() >= oneHourAgo);
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return index === -1 ? 0 : index;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「getWeatherChartBarHeight」の処理ブロックを開始する。
function getWeatherChartBarHeight(probability) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (probability <= 0) return WEATHER_CHART_EMPTY_BAR_HEIGHT;
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return Math.max(
        // 詳細: 次の処理行「WEATHER_CHART_BAR_MIN_HEIGHT,」の役割を、その場の制御フローに組み込む。
        WEATHER_CHART_BAR_MIN_HEIGHT,
        // 詳細: 次の処理行「(probability / 100) * WEATHER_CHART_BAR_MAX_HEIGHT」の役割を、その場の制御フローに組み込む。
        (probability / 100) * WEATHER_CHART_BAR_MAX_HEIGHT
    // 詳細: 次の処理行「);」の役割を、その場の制御フローに組み込む。
    );
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「formatWeatherLocationName」の処理ブロックを開始する。
function formatWeatherLocationName(name) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return name.split(',')[0];
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
