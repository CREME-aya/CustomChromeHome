// Spotify 連携手順ページへ Redirect URI と直近エラーを表示する。
document.addEventListener('DOMContentLoaded', () => {
    const redirectUri = window.SpotifyConfig.getRedirectUri();
    const redirectUriInput = document.getElementById('spotify-redirect-uri');
    const copyButton = document.getElementById('copy-spotify-redirect-uri');
    const errorPanel = document.getElementById('spotify-setup-error');
    const errorMessage = document.getElementById('spotify-setup-error-message');
    const errorTime = document.getElementById('spotify-setup-error-time');
    const clearErrorButton = document.getElementById('clear-spotify-setup-error');

    redirectUriInput.value = redirectUri || 'Chrome 拡張機能として読み込んでください。';
    copyButton.disabled = !redirectUri;

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(redirectUri);
            copyButton.textContent = 'コピーしました';
            setTimeout(() => {
                copyButton.textContent = 'URIをコピー';
            }, 1800);
        } catch (error) {
            showPageError(`URIをコピーできませんでした。${error.message}`);
        }
    });

    clearErrorButton.addEventListener('click', () => {
        window.SpotifyConfig.clearAuthError();
        errorPanel.hidden = true;
    });

    const lastError = window.SpotifyConfig.getLastAuthError();
    if (lastError) {
        errorPanel.hidden = false;
        errorMessage.textContent = lastError.message;
        errorTime.textContent = formatErrorTime(lastError.occurredAt);
    }

    /**
     * ページ上にエラーメッセージを表示する
     * @param {string} message 表示するエラーメッセージ
     */
    function showPageError(message) {
        errorPanel.hidden = false;
        errorMessage.textContent = message;
        errorTime.textContent = '';
    }
});

/**
 * エラー発生日時をロケールに応じた文字列にフォーマットする
 * @param {string} occurredAt ISO 8601形式などの日時文字列
 * @returns {string} フォーマットされた日時文字列、または無効な日時の場合は空文字
 */
function formatErrorTime(occurredAt) {
    const date = new Date(occurredAt);
    if (Number.isNaN(date.getTime())) return '';

    return `発生日時: ${date.toLocaleString('ja-JP')}`;
}
