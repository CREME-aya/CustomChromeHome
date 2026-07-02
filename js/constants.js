/**
 * @fileoverview 定数の定義
 * localStorageキーはここへ集約し、各モジュールで文字列を重複させない。
 */

/** @const {string} 背景画像の保存キー */
const STORAGE_KEY_BG = 'custom_bg_image';
/** @const {string} Spotify URLの保存キー */
const STORAGE_KEY_SPOTIFY_URL = 'spotify_url';
/** @const {string} Todoリストの保存キー */
const STORAGE_KEY_TODOS = 'custom_todos';
/** @const {string} クイックリンクの保存キー */
const STORAGE_KEY_LINKS = 'custom_quick_links';
/** @const {string} Google Calendar iCal URLの保存キー */
const STORAGE_KEY_CALENDAR_ICAL_URL = 'custom_google_calendar_ical_url';
/** @const {string} Google Calendar 取得日数の保存キー */
const STORAGE_KEY_CALENDAR_LOOKAHEAD_DAYS = 'custom_google_calendar_lookahead_days';
/** @const {string} UIテーマの保存キー */
const STORAGE_KEY_THEME = 'custom_ui_theme';
/** @const {string} ウィジェット順序の保存キー */
const STORAGE_KEY_WIDGET_ORDER = 'custom_widget_order';
/** @const {string} ウィジェット状態の保存キー */
const STORAGE_KEY_WIDGET_STATES = 'custom_widget_states_v2';
/** @const {string} メディアモードの保存キー */
const STORAGE_KEY_MEDIA_MODE = 'custom_media_mode';

// Google OAuth & API キー
/** @const {string} Google Client IDの保存キー */
const STORAGE_KEY_GOOGLE_CLIENT_ID = 'custom_google_client_id';

/**
 * @const {Object} Google関連のストレージキー
 */
const GOOGLE_STORAGE_KEYS = {
    accessToken: 'google_access_token',
    refreshToken: 'google_refresh_token',
    expiresAt: 'google_token_expires_at',
    grantedScopes: 'google_granted_scopes'
};
/** @const {string} Google Calendar キャッシュの保存キー */
const STORAGE_KEY_GOOGLE_CALENDAR_CACHE = 'custom_google_calendar_cache';
/** @const {string} Google Tasks キャッシュの保存キー */
const STORAGE_KEY_GOOGLE_TASKS_CACHE = 'custom_google_tasks_cache';
/** @const {string} Gmail キャッシュの保存キー */
const STORAGE_KEY_GMAIL_CACHE = 'custom_gmail_cache';
/** @const {string} Google 選択済みカレンダーの保存キー */
const STORAGE_KEY_GOOGLE_SELECTED_CALENDARS = 'custom_google_selected_calendars';
/** @const {string} Google 選択済みタスクリストの保存キー */
const STORAGE_KEY_GOOGLE_SELECTED_TASKLIST = 'custom_google_selected_tasklist';

// GitHub 定数
/** @const {string} GitHub PATの保存キー */
const STORAGE_KEY_GITHUB_PAT = 'custom_github_pat';
/** @const {string} GitHub キャッシュの保存キー */
const STORAGE_KEY_GITHUB_CACHE = 'custom_github_cache';
/** @const {string} GitHub 草キャッシュの保存キー */
const STORAGE_KEY_GITHUB_GRASS_CACHE = 'custom_github_grass_cache';

// 株価 定数
/** @const {string} 株価シンボルの保存キー */
const STORAGE_KEY_STOCKS = 'custom_stock_symbols';
/** @const {string} 株価キャッシュの保存キー */
const STORAGE_KEY_STOCKS_CACHE = 'custom_stocks_cache';
/** @const {string} Google Finance CSV URLの保存キー */
const STORAGE_KEY_STOCKS_SOURCE_URL = 'custom_googlefinance_csv_url';

/** @const {number} カレンダーのデフォルト取得日数 */
const DEFAULT_CALENDAR_LOOKAHEAD_DAYS = 7;
/** @const {number} カレンダーの最大Todoインポート数 */
const MAX_CALENDAR_TODO_IMPORTS = 30;

// ウィジェット配置の基準値。初期配置とリサイズ時の再計算で共有する。
/** @const {number} ウィジェットの通常幅 */
const WIDGET_WIDTH_NORMAL = 340;
/** @const {number} ウィジェットのワイド幅 */
const WIDGET_WIDTH_WIDE = 700;
/** @const {number} ウィジェット間のギャップ */
const WIDGET_GAP = 24;
/** @const {number} ウィジェットグループ間のギャップ */
const WIDGET_GROUP_GAP = 20;
/** @const {number} AIパネルのギャップ */
const WIDGET_AI_PANEL_GAP = 16;
/** @const {number} ウィジェット上部のマージン */
const WIDGET_TOP_MARGIN = 40;
/** @const {number} Spotifyウィジェットの右オフセット */
const WIDGET_SPOTIFY_RIGHT_OFFSET = 360;
/** @const {number} Spotifyウィジェットの上オフセット */
const WIDGET_SPOTIFY_TOP = 10;
/** @const {number} 時計・天気ウィジェットの高さ */
const WIDGET_CLOCK_WEATHER_HEIGHT = 170;
/** @const {number} 検索ウィジェットの高さ */
const WIDGET_SEARCH_HEIGHT = 60;
/** @const {number} AIパネルの高さ */
const WIDGET_AI_PANEL_HEIGHT = 240;
/** @const {number} ユーティリティウィジェットの高さ */
const WIDGET_UTILITY_HEIGHT = 280;
/** @const {number} 3カラムレイアウトの最小幅 */
const WIDGET_THREE_COLUMN_MIN_WIDTH = (WIDGET_WIDTH_NORMAL * 3) + (WIDGET_AI_PANEL_GAP * 2);
/** @const {number} 2カラムレイアウトの最小幅 */
const WIDGET_TWO_COLUMN_MIN_WIDTH = WIDGET_WIDTH_WIDE;
/** @const {number} リサイズゾーンのピクセル幅 */
const RESIZE_ZONE_PX = 20;

/**
 * @const {Object} Spotify関連のストレージキー
 * 認証トークンの保存先と、期限前更新の余裕時間。
 */
const SPOTIFY_STORAGE_KEYS = {
    accessToken: 'spotify_access_token',
    refreshToken: 'spotify_refresh_token',
    expiresAt: 'spotify_token_expires_at'
};
/** @const {number} Spotifyトークンの更新余裕時間（ミリ秒） */
const SPOTIFY_TOKEN_REFRESH_MARGIN_MS = 60000;

/**
 * @const {string[]} プリセット背景画像のURL一覧
 * 高品質な風景画像のプリセット（Chrome標準の新しいタブに似た雰囲気のもの）
 */
const PRESET_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744012022-28d5002ba30b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'
];
