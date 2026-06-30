// ==========================================
// Feed Parser / Sanitizer
// ==========================================
(function() {
window.FeedParser = {
    createSanitizedPreview,
    getFeedHostname,
    getSafeHttpUrl,
    stripHtml
};

function createSanitizedPreview(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '<p>プレビュー内容がありません。</p>');
    sanitizeNodeTree(template.content);
    return template.content;
}

function sanitizeNodeTree(root) {
    const allowedTags = new Set([
        'P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I',
        'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'A', 'IMG'
    ]);

    const discardTags = new Set([
        'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'CANVAS', 'VIDEO', 'AUDIO'
    ]);

    Array.from(root.querySelectorAll('*')).forEach((element) => {
        const tagName = element.tagName;
        if (discardTags.has(tagName)) {
            element.remove();
            return;
        }

        if (!allowedTags.has(tagName)) {
            element.replaceWith(...element.childNodes);
            return;
        }

        const originalHref = element.getAttribute('href');
        const originalSource = element.getAttribute('src');
        Array.from(element.attributes).forEach(attribute => element.removeAttribute(attribute.name));

        if (tagName === 'A') {
            const safeHref = getSafeHttpUrl(originalHref);
            if (safeHref) {
                element.href = safeHref;
                element.target = '_blank';
                element.rel = 'noopener noreferrer';
            }
        }

        if (tagName === 'IMG') {
            const safeSource = getSafeHttpUrl(originalSource);
            if (safeSource) {
                element.src = safeSource;
                element.alt = '';
                element.loading = 'lazy';
            } else {
                element.remove();
            }
        }
    });
}

function getSafeHttpUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (error) {
        return '';
    }
}

function getFeedHostname(feedUrl) {
    try {
        return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch (error) {
        return '';
    }
}

function stripHtml(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    return template.content.textContent.trim();
}
})();
