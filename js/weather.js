/**
 * 天気ウィジェットのグローバル関数を初期化します。
 * WeatherWidgetオブジェクトから必要なメソッドをwindowオブジェクトにマッピングします。
 */
(function() {
    window.initWeatherSettings = window.WeatherWidget?.initWeatherSettings;
    window.loadWeather = window.WeatherWidget?.loadWeather;
})();
