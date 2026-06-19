// ==========================================
// Open-Meteo APIから天気・降水確率情報を取得して描画する
// ==========================================
(function() {
window.initWeatherSettings = initWeatherSettings;
window.loadWeather = loadWeather;

async function loadWeather() {
    const weatherWidget = document.getElementById('weather-widget');
    if (!weatherWidget) return;

    try {
        const location = getStoredWeatherLocation();
        const meteoRes = await fetch(buildWeatherForecastUrl(location));
        if (!meteoRes.ok) throw new Error('HTTP Error');
        const meteoData = await meteoRes.json();
        weatherWidget.innerHTML = renderWeatherWidget(location.name, meteoData);
    } catch (e) {
        console.error(e);
        weatherWidget.innerHTML = '<div class="weather-error">天気情報の取得に失敗しました</div>';
    }
}

function initWeatherSettings() {
    const cityInput = document.getElementById('weather-city-input');
    const cityButton = document.getElementById('weather-city-btn');
    const status = document.getElementById('weather-city-status');

    updateWeatherCityStatus(status);

    if (cityButton && cityInput) {
        cityButton.addEventListener('click', () => handleWeatherCitySearch(cityInput, status));
    }
}

function updateWeatherCityStatus(status) {
    if (!status) return;
    status.textContent = `現在: ${getStoredWeatherLocation().name}`;
}

function resetWeatherCityStatus(status) {
    setTimeout(() => updateWeatherCityStatus(status), WEATHER_STATUS_RESET_DELAY_MS);
}

async function handleWeatherCitySearch(input, status) {
    const query = input.value.trim();
    if (!query) return;

    setWeatherStatus(status, '検索中...');
    try {
        const location = await fetchWeatherLocationByCity(query);
        if (!location) {
            setWeatherStatus(status, '見つかりませんでした');
            resetWeatherCityStatus(status);
            return;
        }

        saveWeatherLocation(location);
        input.value = '';
        updateWeatherCityStatus(status);
        loadWeather();
    } catch (e) {
        setWeatherStatus(status, 'エラーが発生しました');
        resetWeatherCityStatus(status);
    }
}

function setWeatherStatus(status, message) {
    if (status) status.textContent = message;
}

async function fetchWeatherLocationByCity(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=ja&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    return {
        lat: String(result.latitude),
        lon: String(result.longitude),
        name: result.name + (result.admin1 ? `, ${result.admin1}` : '')
    };
}

function saveWeatherLocation({ lat, lon, name }) {
    localStorage.setItem(WEATHER_STORAGE_KEYS.lat, lat);
    localStorage.setItem(WEATHER_STORAGE_KEYS.lon, lon);
    localStorage.setItem(WEATHER_STORAGE_KEYS.name, name);
}

function getStoredWeatherLocation() {
    return {
        lat: localStorage.getItem(WEATHER_STORAGE_KEYS.lat) || DEFAULT_WEATHER_LOCATION.lat,
        lon: localStorage.getItem(WEATHER_STORAGE_KEYS.lon) || DEFAULT_WEATHER_LOCATION.lon,
        name: localStorage.getItem(WEATHER_STORAGE_KEYS.name) || DEFAULT_WEATHER_LOCATION.name
    };
}

function buildWeatherForecastUrl({ lat, lon }) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current_weather: 'true',
        hourly: 'precipitation_probability',
        timezone: 'Asia/Tokyo',
        models: 'jma_seamless'
    });

    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function renderWeatherWidget(locationName, meteoData) {
    const current = meteoData.current_weather;
    const weather = WMO_WEATHER[current.weathercode] || { emoji: '🌡️', text: '不明' };
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

function renderWeatherChart(times, precipitationProbabilities) {
    const startIndex = findForecastStartIndex(times);
    const chartItems = [];

    for (let i = 0; i < WEATHER_CHART_HOURS; i++) {
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

function findForecastStartIndex(times) {
    const oneHourAgo = Date.now() - 3600000;
    const index = times.findIndex(time => new Date(time).getTime() >= oneHourAgo);
    return index === -1 ? 0 : index;
}

function getWeatherChartBarHeight(probability) {
    if (probability <= 0) return WEATHER_CHART_EMPTY_BAR_HEIGHT;
    return Math.max(
        WEATHER_CHART_BAR_MIN_HEIGHT,
        (probability / 100) * WEATHER_CHART_BAR_MAX_HEIGHT
    );
}

function formatWeatherLocationName(name) {
    return name.split(',')[0];
}
})();
