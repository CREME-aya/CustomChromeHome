// ==========================================
// 定数の定義
// ==========================================
// localStorageキーはここへ集約し、各モジュールで文字列を重複させない。
// 詳細: 変数「STORAGE_KEY_BG」を、この後の処理で使う値として用意する。
const STORAGE_KEY_BG = 'custom_bg_image';
// 詳細: 変数「STORAGE_KEY_SPOTIFY_URL」を、この後の処理で使う値として用意する。
const STORAGE_KEY_SPOTIFY_URL = 'spotify_url';
// 詳細: 変数「STORAGE_KEY_TODOS」を、この後の処理で使う値として用意する。
const STORAGE_KEY_TODOS = 'custom_todos';
// 詳細: 変数「STORAGE_KEY_LINKS」を、この後の処理で使う値として用意する。
const STORAGE_KEY_LINKS = 'custom_quick_links';
// 詳細: 変数「STORAGE_KEY_CALENDAR_ICAL_URL」を、この後の処理で使う値として用意する。
const STORAGE_KEY_CALENDAR_ICAL_URL = 'custom_google_calendar_ical_url';
// 詳細: 変数「STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS」を、この後の処理で使う値として用意する。
const STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS = 'custom_google_calendar_lookahead_days';
// 詳細: 変数「STORAGE_KEY_THEME」を、この後の処理で使う値として用意する。
const STORAGE_KEY_THEME = 'custom_ui_theme';
// 詳細: 変数「STORAGE_KEY_WIDGET_ORDER」を、この後の処理で使う値として用意する。
const STORAGE_KEY_WIDGET_ORDER = 'custom_widget_order';
// 詳細: 変数「STORAGE_KEY_WIDGET_STATES」を、この後の処理で使う値として用意する。
const STORAGE_KEY_WIDGET_STATES = 'custom_widget_states_v2';
// 詳細: 変数「STORAGE_KEY_MEDIA_MODE」を、この後の処理で使う値として用意する。
const STORAGE_KEY_MEDIA_MODE = 'custom_media_mode';

// Google OAuth & API キー
const STORAGE_KEY_GOOGLE_CLIENT_ID = 'custom_google_client_id';
const GOOGLE_STORAGE_KEYS = {
    accessToken: 'google_access_token',
    refreshToken: 'google_refresh_token',
    expiresAt: 'google_token_expires_at',
    grantedScopes: 'google_granted_scopes'
};
const STORAGE_KEY_GOOGLE_CALENDAR_CACHE = 'custom_google_calendar_cache';
const STORAGE_KEY_GOOGLE_TASKS_CACHE = 'custom_google_tasks_cache';
const STORAGE_KEY_GMAIL_CACHE = 'custom_gmail_cache';
const STORAGE_KEY_GOOGLE_SELECTED_CALENDARS = 'custom_google_selected_calendars';
const STORAGE_KEY_GOOGLE_SELECTED_TASKLIST = 'custom_google_selected_tasklist';

// GitHub 定数
const STORAGE_KEY_GITHUB_PAT = 'custom_github_pat';
const STORAGE_KEY_GITHUB_CACHE = 'custom_github_cache';
const STORAGE_KEY_GITHUB_GRASS_CACHE = 'custom_github_grass_cache';

// 株価 定数
const STORAGE_KEY_STOCKS = 'custom_stock_symbols';
const STORAGE_KEY_STOCKS_CACHE = 'custom_stocks_cache';
const STORAGE_KEY_STOCKS_SOURCE_URL = 'custom_googlefinance_csv_url';

// 詳細: 変数「DEFAULT_CALENDAR_LOOKAHEAD_DAYS」を、この後の処理で使う値として用意する。
const DEFAULT_CALENDAR_LOOKAHEAD_DAYS = 7;
// 詳細: 変数「MAX_CALENDAR_TODO_IMPORTS」を、この後の処理で使う値として用意する。
const MAX_CALENDAR_TODO_IMPORTS = 30;

// ウィジェット配置の基準値。初期配置とリサイズ時の再計算で共有する。
// 詳細: 変数「WIDGET_WIDTH_NORMAL」を、この後の処理で使う値として用意する。
const WIDGET_WIDTH_NORMAL = 340;
// 詳細: 変数「WIDGET_WIDTH_WIDE」を、この後の処理で使う値として用意する。
const WIDGET_WIDTH_WIDE = 700;
// 詳細: 変数「WIDGET_GAP」を、この後の処理で使う値として用意する。
const WIDGET_GAP = 24;
// 詳細: 変数「WIDGET_GROUP_GAP」を、この後の処理で使う値として用意する。
const WIDGET_GROUP_GAP = 20;
// 詳細: 変数「WIDGET_AI_PANEL_GAP」を、この後の処理で使う値として用意する。
const WIDGET_AI_PANEL_GAP = 16;
// 詳細: 変数「WIDGET_TOP_MARGIN」を、この後の処理で使う値として用意する。
const WIDGET_TOP_MARGIN = 40;
// 詳細: 変数「WIDGET_SPOTIFY_RIGHT_OFFSET」を、この後の処理で使う値として用意する。
const WIDGET_SPOTIFY_RIGHT_OFFSET = 360;
// 詳細: 変数「WIDGET_SPOTIFY_TOP」を、この後の処理で使う値として用意する。
const WIDGET_SPOTIFY_TOP = 10;
// 詳細: 変数「WIDGET_CLOCK_WEATHER_HEIGHT」を、この後の処理で使う値として用意する。
const WIDGET_CLOCK_WEATHER_HEIGHT = 170;
// 詳細: 変数「WIDGET_SEARCH_HEIGHT」を、この後の処理で使う値として用意する。
const WIDGET_SEARCH_HEIGHT = 60;
// 詳細: 変数「WIDGET_AI_PANEL_HEIGHT」を、この後の処理で使う値として用意する。
const WIDGET_AI_PANEL_HEIGHT = 240;
// 詳細: 変数「WIDGET_UTILITY_HEIGHT」を、この後の処理で使う値として用意する。
const WIDGET_UTILITY_HEIGHT = 280;
// 詳細: 変数「WIDGET_THREE_COLUMN_MIN_WIDTH」を、この後の処理で使う値として用意する。
const WIDGET_THREE_COLUMN_MIN_WIDTH = (WIDGET_WIDTH_NORMAL * 3) + (WIDGET_AI_PANEL_GAP * 2);
// 詳細: 変数「WIDGET_TWO_COLUMN_MIN_WIDTH」を、この後の処理で使う値として用意する。
const WIDGET_TWO_COLUMN_MIN_WIDTH = WIDGET_WIDTH_WIDE;
// 詳細: 変数「RESIZE_ZONE_PX」を、この後の処理で使う値として用意する。
const RESIZE_ZONE_PX = 20;
// Spotify認証トークンの保存先と、期限前更新の余裕時間。
// 詳細: 変数「SPOTIFY_STORAGE_KEYS」を、この後の処理で使う値として用意する。
const SPOTIFY_STORAGE_KEYS = {
    // 詳細: オブジェクトのプロパティ値を定義する。
    accessToken: 'spotify_access_token',
    // 詳細: オブジェクトのプロパティ値を定義する。
    refreshToken: 'spotify_refresh_token',
    // 詳細: 次の処理行「expiresAt: 'spotify_token_expires_at'」の役割を、その場の制御フローに組み込む。
    expiresAt: 'spotify_token_expires_at'
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
};
// 詳細: 変数「SPOTIFY_TOKEN_REFRESH_MARGIN_MS」を、この後の処理で使う値として用意する。
const SPOTIFY_TOKEN_REFRESH_MARGIN_MS = 60000;

// 高品質な風景画像のプリセット（Chrome標準の新しいタブに似た雰囲気のもの）
// 詳細: 変数「PRESET_BACKGROUNDS」を、この後の処理で使う値として用意する。
const PRESET_BACKGROUNDS = [
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop',
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1506744012022-28d5002ba30b?q=80&w=1920&auto=format&fit=crop',
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop',
    // 詳細: オブジェクトのプロパティ値を定義する。
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1920&auto=format&fit=crop',
    // 詳細: 次の処理行「'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=」の役割を、その場の制御フローに組み込む。
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'
// 詳細: 配列リテラルの境界を定義する。
];
