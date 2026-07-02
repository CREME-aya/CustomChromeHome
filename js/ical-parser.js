// ==========================================
// iCal 予定パーサー
// ==========================================
(function() {
window.parseIcsEvents = parseIcsEvents;

/**
 * iCal形式のテキストを解析して予定オブジェクトの配列を返す
 * @param {string} icsText - 解析対象のiCalテキスト
 * @returns {Array<Object>} 予定オブジェクトの配列
 */
function parseIcsEvents(icsText) {
    const events = [];
    let currentEvent = null;

    // iCalの折り返し行を先に復元してから、VEVENT単位でプロパティを集める。
    unfoldIcsLines(icsText).forEach(line => {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            return;
        }

        if (line === 'END:VEVENT') {
            const event = normalizeIcsEvent(currentEvent);
            if (event) events.push(event);
            currentEvent = null;
            return;
        }

        if (!currentEvent) return;

        const property = parseIcsProperty(line);
        if (!property) return;

        currentEvent[property.name] = property;
    });

    return events;
}

/**
 * RFC 5545 の折り返し行(folded line)を復元する
 * @param {string} icsText - iCalテキスト
 * @returns {Array<string>} 折り返しを解除した行の配列
 */
function unfoldIcsLines(icsText) {
    // RFC 5545 の folded line は先頭スペースまたはタブを前行へ連結する。
    return icsText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .reduce((lines, line) => {
            if (/^[ \t]/.test(line) && lines.length > 0) {
                lines[lines.length - 1] += line.slice(1);
            } else {
                lines.push(line);
            }
            return lines;
        }, []);
}

/**
 * iCalの1行のプロパティを解析する
 * @param {string} line - 解析対象の行
 * @returns {Object|null} 解析結果のプロパティオブジェクト（name, params, valueを含む）
 */
function parseIcsProperty(line) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return null;

    // NAME;PARAM=VALUE:VALUE 形式を、名前・パラメータ・値に分解する。
    const rawName = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name, ...paramParts] = rawName.split(';');

    return {
        name: name.toUpperCase(),
        params: parseIcsParams(paramParts),
        value
    };
}

/**
 * iCalプロパティのパラメータ部分を解析する
 * @param {Array<string>} paramParts - パラメータ文字列の配列
 * @returns {Object} パラメータのキーバリューオブジェクト
 */
function parseIcsParams(paramParts) {
    return paramParts.reduce((params, part) => {
        const [key, value] = part.split('=');
        if (key && value) params[key.toUpperCase()] = value.replace(/^"|"$/g, '');
        return params;
    }, {});
}

/**
 * 解析されたiCalのイベントオブジェクトを正規化する
 * @param {Object} rawEvent - 生のイベントオブジェクト
 * @returns {Object|null} Todo取り込みで必要な最小フィールドに正規化されたオブジェクト
 */
function normalizeIcsEvent(rawEvent) {
    if (!rawEvent?.DTSTART) return null;

    // Todo取り込みで必要な最小フィールドだけに正規化する。
    const start = parseIcsDate(rawEvent.DTSTART);
    if (!start.date) return null;

    const uid = unescapeIcsText(rawEvent.UID?.value || `${rawEvent.SUMMARY?.value || 'event'}-${rawEvent.DTSTART.value}`);

    return {
        id: uid,
        summary: unescapeIcsText(rawEvent.SUMMARY?.value || '予定'),
        start: start.date,
        isAllDay: start.isAllDay
    };
}

/**
 * iCalの日付プロパティを解析してDateオブジェクトと終日フラグを返す
 * @param {Object} property - 日付プロパティオブジェクト
 * @returns {Object} date: Dateオブジェクト, isAllDay: 終日フラグ
 */
function parseIcsDate(property) {
    const value = property.value;
    const isDateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);

    if (isDateOnly) {
        // 終日予定は利用者のローカル日付として扱う。
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6)) - 1;
        const day = Number(value.slice(6, 8));
        return { date: new Date(year, month, day), isAllDay: true };
    }

    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) return { date: null, isAllDay: false };

    const [, year, month, day, hour, minute, second, utcSuffix] = match;
    // Z付きはUTC、Zなしはローカル時刻としてDateへ変換する。
    const date = utcSuffix
        ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
        : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

    return { date, isAllDay: false };
}

/**
 * iCal内のエスケープ表現を通常文字列に戻す
 * @param {string} text - エスケープされたテキスト
 * @returns {string} エスケープ解除されたテキスト
 */
function unescapeIcsText(text) {
    // iCal内のエスケープ表現を画面表示向けの通常文字列へ戻す。
    return text
        .replace(/\\n/gi, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}
})();
