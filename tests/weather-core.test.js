const fs = require('fs');
const vm = require('vm');

global.window = globalThis;
vm.runInThisContext(fs.readFileSync('js/weather.js', 'utf8'));

const buildQueries = window.WeatherCore.buildWeatherSearchQueries;

function assertEqual(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

assertEqual(buildQueries('渋谷区'), ['渋谷区', '渋谷']);
assertEqual(buildQueries('横浜市'), ['横浜市', '横浜']);
assertEqual(buildQueries('Tokyo'), ['Tokyo']);
assertEqual(buildQueries(''), []);
console.log('PASS 天気検索候補の生成');
