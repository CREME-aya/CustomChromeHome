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
            meteoData.hourly.precipitation_probability
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
     * 降水確率のチャートHTML文字列を生成する。
     * @param {Array<string>} times - 予測日時のリスト
     * @param {Array<number>} precipitationProbabilities - 降水確率のリスト
     * @returns {string} チャートの HTML 文字列
     */
    function renderWeatherChart(times, precipitationProbabilities) {
        const startIndex = findForecastStartIndex(times);
        const chartItems = [];

        for (let i = 0; i < window.WeatherConstants.chartHours; i++) {
            const index = startIndex + i;
            if (index >= times.length) break;

            const probability = precipitationProbabilities[index] || 0;
            const hour = new Date(times[index]).getHours().toString().padStart(2, '0');
            const height = getWeatherChartBarHeight(probability);
            const opacity = probability > 0 ? 1 : 0.3;

            chartItems.push(`
                <div class="weather-chart-bar-wrap">
                    <span class="weather-chart-val">${probability}</span>
                    <div class="weather-chart-bar" style="height: ${height}px; opacity: ${opacity};"></div>
                    <span class="weather-chart-label">${hour}</span>
                </div>
            `);
        }

        return `<div class="weather-chart-container">${chartItems.join('')}</div>`;
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
     * 降水確率に応じたチャートバーの高さを計算する。
     * @param {number} probability - 降水確率 (0-100)
     * @returns {number} バーの高さ (px)
     */
    function getWeatherChartBarHeight(probability) {
        if (probability <= 0) return window.WeatherConstants.chartEmptyBarHeight;
        return Math.max(
            window.WeatherConstants.chartBarMinHeight,
            (probability / 100) * window.WeatherConstants.chartBarMaxHeight
        );
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
        getWeatherChartBarHeight,
        formatWeatherLocationName
    };

    window.initWeatherSettings = initWeatherSettings;
    window.loadWeather = loadWeather;
})();
