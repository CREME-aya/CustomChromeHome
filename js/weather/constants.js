(function() {
    /**
     * 天気関連の定数定義
     */
    window.WeatherConstants = Object.freeze({
        /** ストレージキー */
        storageKeys: Object.freeze({
            lat: 'custom_weather_lat',
            lon: 'custom_weather_lon',
            name: 'custom_weather_name'
        }),
        /** デフォルトの地域情報（東京） */
        defaultLocation: Object.freeze({
            lat: '35.6895',
            lon: '139.6917',
            name: '東京都'
        }),
        /** ステータス表示をリセットするまでのミリ秒数 */
        statusResetDelayMs: 3000,
        /** チャートに表示する時間数 */
        chartHours: 6,
        /** 予報に使う Open-Meteo のモデル（気象庁 MSM/GSM） */
        forecastModel: 'jma_seamless',
        /** 降水量チャートの縦軸の上限候補 (mm)。最大値以上の最小の値を使う */
        chartAxisSteps: Object.freeze([1, 2, 5, 10, 20, 50, 100]),
        /** 降水量チャートの描画サイズと余白 (px) */
        chartSize: Object.freeze({ width: 200, height: 64, top: 10, right: 8, bottom: 14, left: 32 }),
        /** WMO 天気コードと絵文字・テキストのマッピング */
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
