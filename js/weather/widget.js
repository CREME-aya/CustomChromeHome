(function() {
    /**
     * 天気情報を読み込み、ウィジェットに描画する。
     * @returns {Promise<void>}
     */
    async function loadWeather() {
        const weatherWidget = document.getElementById('weather-widget');
        if (!weatherWidget) return;

        window.ApiUI?.setLoading('weather-widget', '天気情報を取得中...');

        try {
            const location = window.WeatherData.getStoredWeatherLocation();
            const meteoData = await window.WeatherData.fetchWeatherForecast(location);
            weatherWidget.innerHTML = renderWeatherWidget(location.name, meteoData);
            window.ApiDiagnostics?.report('weather', 'ok', `${location.name} の天気取得に成功`);
        } catch (error) {
            console.error(error);
            window.ApiUI?.setError('weather-widget', '天気情報の取得に失敗しました');
            window.ApiDiagnostics?.report('weather', 'error', '天気情報の取得に失敗');
        }
    }

    /**
     * 天気設定のUIとイベントリスナーを初期化する。
     */
    function initWeatherSettings() {
        const cityInput = document.getElementById('weather-city-input');
        const cityButton = document.getElementById('weather-city-btn');
        const status = document.getElementById('weather-city-status');

        updateWeatherCityStatus(status);

        if (cityButton && cityInput) {
            cityButton.addEventListener('click', () => handleWeatherCitySearch(cityInput, status));
        }
    }

    /**
     * 設定された地域名をステータス要素に反映する。
     * @param {HTMLElement} status - ステータスを表示するDOM要素
     */
    function updateWeatherCityStatus(status) {
        if (!status) return;
        status.textContent = `現在: ${window.WeatherData.getStoredWeatherLocation().name}`;
    }

    /**
     * 一定時間後にステータス表示を現在の地域名にリセットする。
     * @param {HTMLElement} status - ステータスを表示するDOM要素
     */
    function resetWeatherCityStatus(status) {
        setTimeout(() => updateWeatherCityStatus(status), window.WeatherConstants.statusResetDelayMs);
    }

    /**
     * 都市名検索の入力を処理し、天気を更新する。
     * @param {HTMLInputElement} input - 都市名入力フィールド
     * @param {HTMLElement} status - ステータスを表示するDOM要素
     * @returns {Promise<void>}
     */
    async function handleWeatherCitySearch(input, status) {
        const query = input.value.trim();
        if (!query) return;

        setWeatherStatus(status, '検索中...');

        try {
            const location = await window.WeatherData.fetchWeatherLocationByCity(query);
            if (!location) {
                setWeatherStatus(status, '見つかりませんでした');
                resetWeatherCityStatus(status);
                return;
            }

            window.WeatherData.saveWeatherLocation(location);
            input.value = '';
            updateWeatherCityStatus(status);
            loadWeather();
        } catch (error) {
            setWeatherStatus(status, 'エラーが発生しました');
            resetWeatherCityStatus(status);
        }
    }

    /**
     * ステータス要素にメッセージを設定する。
     * @param {HTMLElement} status - ステータスを表示するDOM要素
     * @param {string} message - 表示するメッセージ
     */
    function setWeatherStatus(status, message) {
        if (!status) return;

        window.ApiUI?.setStatus(status.id, message, {
            type: 'info',
            baseClass: status.className
        });
    }

    /**
     * 天気ウィジェットの HTML 文字列を生成する。
     * @param {string} locationName - 地域名
     * @param {Object} meteoData - Open-Meteo から取得した天気データ
     * @returns {string} ウィジェットの HTML 文字列
     */
    function renderWeatherWidget(locationName, meteoData) {
        const current = meteoData.current_weather;
        const weather = window.WeatherConstants.wmoWeather[current.weathercode] || { emoji: '🌡️', text: '不明' };
        const chartHTML = renderWeatherChart(
            meteoData.hourly.time,
            meteoData.hourly.precipitation
        );

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
    }

    /**
     * 1時間降水量の折れ線チャート (SVG) の HTML 文字列を生成する。
     * 横軸は時刻、縦軸は降水量 (mm)。
     * @param {Array<string>} times - 予測日時のリスト
     * @param {Array<number>} precipitations - 1時間降水量 (mm) のリスト
     * @returns {string} チャートの HTML 文字列
     */
    function renderWeatherChart(times, precipitations) {
        const { chartHours, chartSize } = window.WeatherConstants;
        const startIndex = findForecastStartIndex(times);
        const points = [];

        for (let i = 0; i < chartHours && startIndex + i < times.length; i++) {
            const index = startIndex + i;
            points.push({
                hour: new Date(times[index]).getHours().toString().padStart(2, '0'),
                value: Number(precipitations?.[index]) || 0
            });
        }

        if (points.length === 0) return '<div class="weather-chart-container"></div>';

        const { width, height, top, right, bottom, left } = chartSize;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;
        const baseY = top + plotHeight;
        const axisMax = getWeatherChartAxisMax(points.map(point => point.value));
        const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
        const xOf = i => left + (points.length > 1 ? i * stepX : plotWidth / 2);
        const yOf = value => baseY - (value / axisMax) * plotHeight;

        const linePath = points.map((point, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(point.value).toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L${xOf(points.length - 1).toFixed(1)},${baseY} L${xOf(0).toFixed(1)},${baseY} Z`;

        // 最大値の点だけ数値を直接表示する（雨がない時は表示しない）
        const peakIndex = points.reduce((best, point, i) => (point.value > points[best].value ? i : best), 0);
        const peak = points[peakIndex];
        const peakLabel = peak.value > 0
            ? `<text class="weather-chart-peak" x="${xOf(peakIndex).toFixed(1)}" y="${(yOf(peak.value) - 4).toFixed(1)}" text-anchor="middle">${peak.value}</text>`
            : '';

        const hitWidth = points.length > 1 ? stepX : plotWidth;
        const pointItems = points.map((point, i) => `
            <g class="weather-chart-point">
                <title>${point.hour}時 ${point.value}mm</title>
                <rect class="weather-chart-hit" x="${(xOf(i) - hitWidth / 2).toFixed(1)}" y="${top}" width="${hitWidth.toFixed(1)}" height="${height - top}"></rect>
                <circle class="weather-chart-dot" cx="${xOf(i).toFixed(1)}" cy="${yOf(point.value).toFixed(1)}" r="2.5"></circle>
                <text class="weather-chart-label" x="${xOf(i).toFixed(1)}" y="${height - 2}" text-anchor="middle">${point.hour}</text>
            </g>`).join('');

        return `
            <div class="weather-chart-container">
                <svg class="weather-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="1時間降水量 (mm)・気象庁モデル">
                    <line class="weather-chart-grid" x1="${left}" y1="${top}" x2="${width - right}" y2="${top}"></line>
                    <line class="weather-chart-axis" x1="${left}" y1="${baseY}" x2="${width - right}" y2="${baseY}"></line>
                    <text class="weather-chart-tick" x="${left - 4}" y="${top + 3}" text-anchor="end">${axisMax}mm</text>
                    <text class="weather-chart-tick" x="${left - 4}" y="${baseY + 3}" text-anchor="end">0</text>
                    <path class="weather-chart-area" d="${areaPath}"></path>
                    <path class="weather-chart-line" d="${linePath}"></path>
                    ${peakLabel}
                    ${pointItems}
                </svg>
            </div>`;
    }

    /**
     * 現在時刻に最も近い予測データの開始インデックスを取得する。
     * @param {Array<string>} times - 予測日時のリスト
     * @returns {number} 開始インデックス
     */
    function findForecastStartIndex(times) {
        const oneHourAgo = Date.now() - 3600000;
        const index = times.findIndex(time => new Date(time).getTime() >= oneHourAgo);
        return index === -1 ? 0 : index;
    }

    /**
     * 降水量チャートの縦軸の上限を決める。
     * 最大値以上で最小の候補値を使い、雨がない時も 1mm の軸を表示する。
     * @param {Array<number>} values - 1時間降水量 (mm) のリスト
     * @returns {number} 縦軸の上限 (mm)
     */
    function getWeatherChartAxisMax(values) {
        const { chartAxisSteps } = window.WeatherConstants;
        const max = Math.max(0, ...values);
        return chartAxisSteps.find(step => step >= max) ?? Math.ceil(max);
    }

    /**
     * 地域名から主要部分のみを抽出してフォーマットする。
     * @param {string} name - 元の地域名
     * @returns {string} フォーマットされた地域名
     */
    function formatWeatherLocationName(name) {
        return name.split(',')[0];
    }

    window.WeatherWidget = {
        initWeatherSettings,
        loadWeather,
        renderWeatherWidget,
        renderWeatherChart,
        findForecastStartIndex,
        getWeatherChartAxisMax,
        formatWeatherLocationName
    };

    window.initWeatherSettings = initWeatherSettings;
    window.loadWeather = loadWeather;
})();
