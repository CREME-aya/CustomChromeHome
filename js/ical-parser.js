// ==========================================
// iCal 予定パーサー
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.parseIcsEvents = parseIcsEvents;

// 詳細: 関数「parseIcsEvents」の処理ブロックを開始する。
function parseIcsEvents(icsText) {
    // 詳細: 変数「events」を、この後の処理で使う値として用意する。
    const events = [];
    // 詳細: 変数「currentEvent」を、この後の処理で使う値として用意する。
    let currentEvent = null;

    // iCalの折り返し行を先に復元してから、VEVENT単位でプロパティを集める。
    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    unfoldIcsLines(icsText).forEach(line => {
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (line === 'BEGIN:VEVENT') {
            // 詳細: 次の処理行「currentEvent = {};」の役割を、その場の制御フローに組み込む。
            currentEvent = {};
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (line === 'END:VEVENT') {
            // 詳細: 変数「event」を、この後の処理で使う値として用意する。
            const event = normalizeIcsEvent(currentEvent);
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (event) events.push(event);
            // 詳細: 次の処理行「currentEvent = null;」の役割を、その場の制御フローに組み込む。
            currentEvent = null;
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!currentEvent) return;

        // 詳細: 変数「property」を、この後の処理で使う値として用意する。
        const property = parseIcsProperty(line);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!property) return;

        // 詳細: 次の処理行「currentEvent[property.name] = property;」の役割を、その場の制御フローに組み込む。
        currentEvent[property.name] = property;
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return events;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「unfoldIcsLines」の処理ブロックを開始する。
function unfoldIcsLines(icsText) {
    // RFC 5545 の folded line は先頭スペースまたはタブを前行へ連結する。
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return icsText
        // 詳細: 次の処理行「.replace(/\r\n/g, '\n')」の役割を、その場の制御フローに組み込む。
        .replace(/\r\n/g, '\n')
        // 詳細: 次の処理行「.replace(/\r/g, '\n')」の役割を、その場の制御フローに組み込む。
        .replace(/\r/g, '\n')
        // 詳細: 次の処理行「.split('\n')」の役割を、その場の制御フローに組み込む。
        .split('\n')
        // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
        .reduce((lines, line) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (/^[ \t]/.test(line) && lines.length > 0) {
                // 詳細: 次の処理行「lines[lines.length - 1] += line.slice(1);」の役割を、その場の制御フローに組み込む。
                lines[lines.length - 1] += line.slice(1);
            // 詳細: オブジェクトまたはブロックの境界を定義する。
            } else {
                // 詳細: 次の処理行「lines.push(line);」の役割を、その場の制御フローに組み込む。
                lines.push(line);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return lines;
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        }, []);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseIcsProperty」の処理ブロックを開始する。
function parseIcsProperty(line) {
    // 詳細: 変数「separatorIndex」を、この後の処理で使う値として用意する。
    const separatorIndex = line.indexOf(':');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (separatorIndex === -1) return null;

    // NAME;PARAM=VALUE:VALUE 形式を、名前・パラメータ・値に分解する。
    // 詳細: 変数「rawName」を、この後の処理で使う値として用意する。
    const rawName = line.slice(0, separatorIndex);
    // 詳細: 変数「value」を、この後の処理で使う値として用意する。
    const value = line.slice(separatorIndex + 1);
    // 詳細: 次の処理行「const [name, ...paramParts] = rawName.split(';');」の役割を、その場の制御フローに組み込む。
    const [name, ...paramParts] = rawName.split(';');

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: オブジェクトのプロパティ値を定義する。
        name: name.toUpperCase(),
        // 詳細: オブジェクトのプロパティ値を定義する。
        params: parseIcsParams(paramParts),
        // 詳細: 次の処理行「value」の役割を、その場の制御フローに組み込む。
        value
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseIcsParams」の処理ブロックを開始する。
function parseIcsParams(paramParts) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return paramParts.reduce((params, part) => {
        // 詳細: 次の処理行「const [key, value] = part.split('=');」の役割を、その場の制御フローに組み込む。
        const [key, value] = part.split('=');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (key && value) params[key.toUpperCase()] = value.replace(/^"|"$/g, '');
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return params;
    // 詳細: オブジェクトまたはブロックの境界を定義する。
    }, {});
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「normalizeIcsEvent」の処理ブロックを開始する。
function normalizeIcsEvent(rawEvent) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!rawEvent?.DTSTART) return null;

    // Todo取り込みで必要な最小フィールドだけに正規化する。
    // 詳細: 変数「start」を、この後の処理で使う値として用意する。
    const start = parseIcsDate(rawEvent.DTSTART);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!start.date) return null;

    // 詳細: 変数「uid」を、この後の処理で使う値として用意する。
    const uid = unescapeIcsText(rawEvent.UID?.value || `${rawEvent.SUMMARY?.value || 'event'}-${rawEvent.DTSTART.value}`);

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: オブジェクトのプロパティ値を定義する。
        id: uid,
        // 詳細: オブジェクトのプロパティ値を定義する。
        summary: unescapeIcsText(rawEvent.SUMMARY?.value || '予定'),
        // 詳細: オブジェクトのプロパティ値を定義する。
        start: start.date,
        // 詳細: 次の処理行「isAllDay: start.isAllDay」の役割を、その場の制御フローに組み込む。
        isAllDay: start.isAllDay
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「parseIcsDate」の処理ブロックを開始する。
function parseIcsDate(property) {
    // 詳細: 変数「value」を、この後の処理で使う値として用意する。
    const value = property.value;
    // 詳細: 変数「isDateOnly」を、この後の処理で使う値として用意する。
    const isDateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (isDateOnly) {
        // 終日予定は利用者のローカル日付として扱う。
        // 詳細: 変数「year」を、この後の処理で使う値として用意する。
        const year = Number(value.slice(0, 4));
        // 詳細: 変数「month」を、この後の処理で使う値として用意する。
        const month = Number(value.slice(4, 6)) - 1;
        // 詳細: 変数「day」を、この後の処理で使う値として用意する。
        const day = Number(value.slice(6, 8));
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return { date: new Date(year, month, day), isAllDay: true };
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 変数「match」を、この後の処理で使う値として用意する。
    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!match) return { date: null, isAllDay: false };

    // 詳細: 次の処理行「const [, year, month, day, hour, minute, second, utcSuffix] = match;」の役割を、その場の制御フローに組み込む。
    const [, year, month, day, hour, minute, second, utcSuffix] = match;
    // Z付きはUTC、Zなしはローカル時刻としてDateへ変換する。
    // 詳細: 変数「date」を、この後の処理で使う値として用意する。
    const date = utcSuffix
        // 詳細: 次の処理行「? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min」の役割を、その場の制御フローに組み込む。
        ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
        // 詳細: 次の処理行「: new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Num」の役割を、その場の制御フローに組み込む。
        : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return { date, isAllDay: false };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「unescapeIcsText」の処理ブロックを開始する。
function unescapeIcsText(text) {
    // iCal内のエスケープ表現を画面表示向けの通常文字列へ戻す。
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return text
        // 詳細: 次の処理行「.replace(/\\n/gi, ' ')」の役割を、その場の制御フローに組み込む。
        .replace(/\\n/gi, ' ')
        // 詳細: 次の処理行「.replace(/\\,/g, ',')」の役割を、その場の制御フローに組み込む。
        .replace(/\\,/g, ',')
        // 詳細: 次の処理行「.replace(/\\;/g, ';')」の役割を、その場の制御フローに組み込む。
        .replace(/\\;/g, ';')
        // 詳細: 次の処理行「.replace(/\\\\/g, '\\')」の役割を、その場の制御フローに組み込む。
        .replace(/\\\\/g, '\\')
        // 詳細: 次の処理行「.trim();」の役割を、その場の制御フローに組み込む。
        .trim();
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
