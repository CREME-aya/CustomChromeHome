// ==========================================
// iCal parser
// ==========================================
(function() {
window.parseIcsEvents = parseIcsEvents;

function parseIcsEvents(icsText) {
    const events = [];
    let currentEvent = null;

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

function unfoldIcsLines(icsText) {
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

function parseIcsProperty(line) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return null;

    const rawName = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name, ...paramParts] = rawName.split(';');

    return {
        name: name.toUpperCase(),
        params: parseIcsParams(paramParts),
        value
    };
}

function parseIcsParams(paramParts) {
    return paramParts.reduce((params, part) => {
        const [key, value] = part.split('=');
        if (key && value) params[key.toUpperCase()] = value.replace(/^"|"$/g, '');
        return params;
    }, {});
}

function normalizeIcsEvent(rawEvent) {
    if (!rawEvent?.DTSTART) return null;

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

function parseIcsDate(property) {
    const value = property.value;
    const isDateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);

    if (isDateOnly) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6)) - 1;
        const day = Number(value.slice(6, 8));
        return { date: new Date(year, month, day), isAllDay: true };
    }

    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) return { date: null, isAllDay: false };

    const [, year, month, day, hour, minute, second, utcSuffix] = match;
    const date = utcSuffix
        ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
        : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

    return { date, isAllDay: false };
}

function unescapeIcsText(text) {
    return text
        .replace(/\\n/gi, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}
})();
