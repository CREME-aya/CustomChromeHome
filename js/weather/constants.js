(function() {
    window.WeatherConstants = Object.freeze({
        storageKeys: Object.freeze({
            lat: 'custom_weather_lat',
            lon: 'custom_weather_lon',
            name: 'custom_weather_name'
        }),
        defaultLocation: Object.freeze({
            lat: '35.6895',
            lon: '139.6917',
            name: '東京都'
        }),
        statusResetDelayMs: 3000,
        chartHours: 6,
        chartBarMaxHeight: 36,
        chartBarMinHeight: 4,
        chartEmptyBarHeight: 2,
        wmoWeather: Object.freeze({
            0: { emoji: '☀️', text: '快晴' },
            1: { emoji: '🌤️', text: '晴れ' },
            2: { emoji: '⛅', text: '一部曇り' },
            3: { emoji: '☁️', text: '曇り' },
            45: { emoji: '🌫️', text: '霧' },
            48: { emoji: '🌫️', text: '霧氷' },
            51: { emoji: '🌦️', text: '弱い霧雨' },
            53: { emoji: '🌦️', text: '霧雨' },
            55: { emoji: '🌧️', text: '強い霧雨' },
            56: { emoji: '🌧️', text: '弱い着氷性霧雨' },
            57: { emoji: '🌧️', text: '強い着氷性霧雨' },
            61: { emoji: '☔', text: '弱い雨' },
            63: { emoji: '☔', text: '雨' },
            65: { emoji: '☔', text: '強い雨' },
            66: { emoji: '🌧️', text: '弱い着氷性の雨' },
            67: { emoji: '🌧️', text: '強い着氷性の雨' },
            71: { emoji: '❄️', text: '弱い雪' },
            73: { emoji: '❄️', text: '雪' },
            75: { emoji: '❄️', text: '強い雪' },
            77: { emoji: '❄️', text: '霧雪' },
            80: { emoji: '☔', text: 'にわか雨' },
            81: { emoji: '☔', text: '強いにわか雨' },
            82: { emoji: '☔', text: '猛烈なにわか雨' },
            85: { emoji: '⛄', text: '雪見舞' },
            86: { emoji: '⛄', text: '強い雪見舞' },
            95: { emoji: '⛈️', text: '雷雨' },
            96: { emoji: '⛈️', text: '雷雨（弱雹）' },
            99: { emoji: '⛈️', text: '雷雨（強雹）' }
        })
    });
})();
