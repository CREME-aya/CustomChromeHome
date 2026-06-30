global.window = global;

const storage = new Map();
let failed = 0;
const tests = [];

const elements = new Map();
global.document = {
    getElementById(id) {
        if (!elements.has(id)) {
            elements.set(id, {
                id,
                className: 'status',
                innerHTML: '',
                textContent: '',
                value: '',
                addEventListener() {}
            });
        }

        return elements.get(id);
    }
};
global.localStorage = {
    getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
        storage.set(key, String(value));
    }
};
global.ApiUI = {
    calls: [],
    setLoading(id, message) {
        this.calls.push({ method: 'setLoading', id, message });
    },
    setError(id, message) {
        this.calls.push({ method: 'setError', id, message });
    },
    setStatus(id, message, options) {
        this.calls.push({ method: 'setStatus', id, message, options });
    }
};
global.ApiDiagnostics = {
    reports: [],
    report(provider, status, message) {
        this.reports.push({ provider, status, message });
    }
};

require('../js/weather/constants.js');
require('../js/weather/data.js');
require('../js/weather/widget.js');
require('../js/weather.js');

function test(name, callback) {
    tests.push({ name, callback });
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('WeatherData.buildWeatherForecastUrl はOpen-Meteo予報URLを生成する', () => {
    const url = new URL(window.WeatherData.buildWeatherForecastUrl({ lat: '35', lon: '139' }));

    assertEqual(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
    assertEqual(url.searchParams.get('latitude'), '35');
    assertEqual(url.searchParams.get('longitude'), '139');
    assertEqual(url.searchParams.get('timezone'), 'Asia/Tokyo');
});

test('WeatherData は保存済み位置と既定位置を読み書きする', () => {
    storage.clear();
    assertEqual(window.WeatherData.getStoredWeatherLocation().name, '東京都');

    window.WeatherData.saveWeatherLocation({ lat: '1', lon: '2', name: 'Test City' });
    assertEqual(window.WeatherData.getStoredWeatherLocation().lat, '1');
    assertEqual(window.WeatherData.getStoredWeatherLocation().lon, '2');
    assertEqual(window.WeatherData.getStoredWeatherLocation().name, 'Test City');
});

test('WeatherData.fetchWeatherLocationByCity は行政区名フォールバックで位置を返す', async () => {
    const requestedUrls = [];
    global.fetch = async url => {
        requestedUrls.push(String(url));
        return {
            ok: true,
            json: async () => ({
                results: requestedUrls.length === 1
                    ? []
                    : [{ latitude: 35.66, longitude: 139.7, name: '渋谷', admin1: '東京都' }]
            })
        };
    };

    const location = await window.WeatherData.fetchWeatherLocationByCity('渋谷区');
    assertEqual(location.lat, '35.66');
    assertEqual(location.lon, '139.7');
    assertEqual(location.name, '渋谷, 東京都');
    assert(requestedUrls[0].includes(encodeURIComponent('渋谷区')), '元の検索語が使われていません');
    assert(requestedUrls[1].includes(encodeURIComponent('渋谷')), '簡略化した検索語が使われていません');
});

test('WeatherWidget.renderWeatherWidget は現在天気と降水チャートを描画する', () => {
    const html = window.WeatherWidget.renderWeatherWidget('東京都, 日本', {
        current_weather: { weathercode: 0, temperature: 24 },
        hourly: {
            time: ['2000-01-01T00:00', '2999-01-01T01:00', '2999-01-01T02:00'],
            precipitation_probability: [0, 25, 80]
        }
    });

    assert(html.includes('東京都'), '地点名が描画されていません');
    assert(html.includes('快晴'), '天気説明が描画されていません');
    assert(html.includes('24℃'), '気温が描画されていません');
    assert(html.includes('weather-chart-container'), '降水チャートが描画されていません');
});

test('loadWeather は取得結果をウィジェットへ描画して診断へ成功を報告する', async () => {
    storage.clear();
    elements.clear();
    window.WeatherData.fetchWeatherForecast = async location => {
        assertEqual(location.name, '東京都');
        return {
            current_weather: { weathercode: 0, temperature: 20 },
            hourly: {
                time: ['2999-01-01T00:00', '2999-01-01T01:00', '2999-01-01T02:00'],
                precipitation_probability: [0, 10, 20]
            }
        };
    };

    await window.loadWeather();

    assert(document.getElementById('weather-widget').innerHTML.includes('20℃'), '天気ウィジェットが更新されていません');
    assertEqual(global.ApiDiagnostics.reports.at(-1).status, 'ok');
});

(async function run() {
    for (const { name, callback } of tests) {
        try {
            await callback();
            console.log(`PASS ${name}`);
        } catch (error) {
            failed += 1;
            console.error(`FAIL ${name}: ${error.message}`);
        }
    }

    if (failed > 0) process.exit(1);
})();
