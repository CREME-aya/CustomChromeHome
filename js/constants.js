// ==========================================
// 定数の定義
// ==========================================
// localStorageキーはここへ集約し、各モジュールで文字列を重複させない。
const DEFAULT_URL = 'https://qiita.com/popular-items/feed';
const STORAGE_KEY_URL = 'custom_feed_url';
const STORAGE_KEY_FAVS = 'custom_feed_favorites';
const STORAGE_KEY_BG = 'custom_bg_image';
const STORAGE_KEY_SPOTIFY_URL = 'spotify_url';
const STORAGE_KEY_TODOS = 'custom_todos';
const STORAGE_KEY_LINKS = 'custom_quick_links';
const STORAGE_KEY_CALENDAR_ICAL_URL = 'custom_google_calendar_ical_url';
const STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS = 'custom_google_calendar_lookahead_days';
const STORAGE_KEY_OPENAI_API_KEY = 'custom_openai_api_key';
const STORAGE_KEY_ANTHROPIC_API_KEY = 'custom_anthropic_api_key';
const STORAGE_KEY_GEMINI_API_KEY = 'custom_gemini_api_key';
const STORAGE_KEY_THEME = 'custom_ui_theme';
const STORAGE_KEY_WIDGET_ORDER = 'custom_widget_order';
const STORAGE_KEY_WIDGET_STATES = 'custom_widget_states_v2';
const STORAGE_KEY_FEED_MODE = 'custom_feed_display_mode';
const DEFAULT_FEED_URLS = [DEFAULT_URL];

// 天気ウィジェットの保存値と描画パラメータ。
const WEATHER_STORAGE_KEYS = {
    lat: 'custom_weather_lat',
    lon: 'custom_weather_lon',
    name: 'custom_weather_name'
};
const DEFAULT_WEATHER_LOCATION = {
    lat: '35.6895',
    lon: '139.6917',
    name: '東京都'
};
const WEATHER_STATUS_RESET_DELAY_MS = 3000;
const WEATHER_CHART_HOURS = 6;
const WEATHER_CHART_BAR_MAX_HEIGHT = 36;
const WEATHER_CHART_BAR_MIN_HEIGHT = 4;
const WEATHER_CHART_EMPTY_BAR_HEIGHT = 2;
const DEFAULT_CALENDAR_LOOKAHEAD_DAYS = 7;
const MAX_CALENDAR_TODO_IMPORTS = 30;

// ウィジェット配置の基準値。初期配置とリサイズ時の再計算で共有する。
const WIDGET_WIDTH_NORMAL = 340;
const WIDGET_WIDTH_WIDE = 700;
const WIDGET_GAP = 24;
const WIDGET_GROUP_GAP = 20;
const WIDGET_AI_PANEL_GAP = 16;
const WIDGET_TOP_MARGIN = 40;
const WIDGET_SPOTIFY_RIGHT_OFFSET = 360;
const WIDGET_SPOTIFY_TOP = 10;
const WIDGET_CLOCK_WEATHER_HEIGHT = 170;
const WIDGET_SEARCH_HEIGHT = 60;
const WIDGET_AI_PANEL_HEIGHT = 240;
const WIDGET_UTILITY_HEIGHT = 280;
const WIDGET_THREE_COLUMN_MIN_WIDTH = (WIDGET_WIDTH_NORMAL * 3) + (WIDGET_AI_PANEL_GAP * 2);
const WIDGET_TWO_COLUMN_MIN_WIDTH = WIDGET_WIDTH_WIDE;
const RESIZE_ZONE_PX = 20;
const FEED_MAX_ITEMS = 20;

// Spotify認証トークンの保存先と、期限前更新の余裕時間。
const SPOTIFY_STORAGE_KEYS = {
    accessToken: 'spotify_access_token',
    refreshToken: 'spotify_refresh_token',
    expiresAt: 'spotify_token_expires_at'
};
const SPOTIFY_TOKEN_REFRESH_MARGIN_MS = 60000;

// Open-MeteoのWMO weather codeを日本語表示へ変換する。
const WMO_WEATHER = {
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
};

// 高品質な風景画像のプリセット（Chrome標準の新しいタブに似た雰囲気のもの）
const PRESET_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744012022-28d5002ba30b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'
];
