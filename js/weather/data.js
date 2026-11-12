(function() {
    /**
     * 検索クエリからジオコーディングAPI用の検索候補リストを生成する。
     * @param {string} query - ユーザーの入力クエリ
     * @returns {Array<string>} 検索クエリのリスト
     */
    function buildWeatherSearchQueries(query) {
        const normalized = String(query || '').trim();
        if (!normalized) return [];

        const simplified = normalized.replace(/(?:都|道|府|県|市|区|町|村)$/u, '').trim();
        return simplified && simplified !== normalized
            ? [normalized, simplified]
            : [normalized];
    }

    /**
     * 都市名から緯度経度情報を取得する。
     * @param {string} query - 検索する都市名
     * @returns {Promise<Object|null>} 緯度経度情報を含むオブジェクト。見つからない場合は null
     */
    async function fetchWeatherLocationByCity(query) {
        let result = null;

        for (const candidate of buildWeatherSearchQueries(query)) {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=ja&format=json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);

            const data = await response.json();
            result = data.results?.[0] || null;
            if (result) break;
        }

        if (!result) return null;

        return {
            lat: String(result.latitude),
            lon: String(result.longitude),
            name: result.name + (result.admin1 ? `, ${result.admin1}` : '')
        };
    }

    /**
     * 地域情報をローカルストレージに保存する。
     * @param {Object} location - 保存する地域情報
     * @param {string} location.lat - 緯度
     * @param {string} location.lon - 経度
     * @param {string} location.name - 地域名
     */
    function saveWeatherLocation({ lat, lon, name }) {
        const { storageKeys } = window.WeatherConstants;
        localStorage.setItem(storageKeys.lat, lat);
        localStorage.setItem(storageKeys.lon, lon);
        localStorage.setItem(storageKeys.name, name);
    }

    /**
     * ローカルストレージから保存された地域情報を取得する。
     * 保存されていない場合はデフォルト値を返す。
     * @returns {Object} 地域情報 (lat, lon, name)
     */
    function getStoredWeatherLocation() {
        const { defaultLocation, storageKeys } = window.WeatherConstants;

        return {
            lat: localStorage.getItem(storageKeys.lat) || defaultLocation.lat,
            lon: localStorage.getItem(storageKeys.lon) || defaultLocation.lon,
            name: localStorage.getItem(storageKeys.name) || defaultLocation.name
        };
    }

    /**
     * Open-Meteo API の天気予報取得用 URL を構築する。
     * 気象庁モデルに固定し、現在天気と降水量の出どころを揃える。
     * （気象庁モデルは降水確率を提供しないため、降水量を使う）
     * @param {Object} location - 地域情報
     * @param {string} location.lat - 緯度
     * @param {string} location.lon - 経度
     * @returns {string} 構築された URL 文字列
     */
    function buildWeatherForecastUrl({ lat, lon }) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current_weather: 'true',
            hourly: 'precipitation',
            models: window.WeatherConstants.forecastModel,
            timezone: 'Asia/Tokyo'
        });

        return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    }

    /**
     * Open-Meteo API から天気予報データを取得する。
     * @param {Object} location - 地域情報
     * @param {string} location.lat - 緯度
     * @param {string} location.lon - 経度
     * @returns {Promise<Object>} APIレスポンスデータ
     */
    async function fetchWeatherForecast(location) {
        const response = await fetch(buildWeatherForecastUrl(location));
        if (!response.ok) throw new Error('HTTP Error');
        return response.json();
    }

    window.WeatherData = {
        buildWeatherSearchQueries,
        fetchWeatherLocationByCity,
        saveWeatherLocation,
        getStoredWeatherLocation,
        buildWeatherForecastUrl,
        fetchWeatherForecast
    };

    window.WeatherCore = {
        buildWeatherSearchQueries
    };
})();
