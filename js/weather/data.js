(function() {
    function buildWeatherSearchQueries(query) {
        const normalized = String(query || '').trim();
        if (!normalized) return [];

        const simplified = normalized.replace(/(?:都|道|府|県|市|区|町|村)$/u, '').trim();
        return simplified && simplified !== normalized
            ? [normalized, simplified]
            : [normalized];
    }

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

    function saveWeatherLocation({ lat, lon, name }) {
        const { storageKeys } = window.WeatherConstants;
        localStorage.setItem(storageKeys.lat, lat);
        localStorage.setItem(storageKeys.lon, lon);
        localStorage.setItem(storageKeys.name, name);
    }

    function getStoredWeatherLocation() {
        const { defaultLocation, storageKeys } = window.WeatherConstants;

        return {
            lat: localStorage.getItem(storageKeys.lat) || defaultLocation.lat,
            lon: localStorage.getItem(storageKeys.lon) || defaultLocation.lon,
            name: localStorage.getItem(storageKeys.name) || defaultLocation.name
        };
    }

    function buildWeatherForecastUrl({ lat, lon }) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current_weather: 'true',
            hourly: 'precipitation_probability',
            timezone: 'Asia/Tokyo'
        });

        return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    }

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
