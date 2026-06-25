// ==========================================
// Feedの純粋ロジック
// ==========================================
(function() {
// DOMやlocalStorageへ依存しない処理を公開し、ブラウザ表示と単体テストで共有する。
window.FeedCore = {
    normalizeDisplayMode,
    parsePublishedAt,
    normalizeArticleUrl,
    normalizeFeedItem,
    deduplicateArticles,
    sortArticles,
    filterArticles,
    groupArticlesBySource,
    createFeedKey
};

// 保存値が壊れていても、予測可能な混合表示へ復旧する。
function normalizeDisplayMode(value) {
    return value === 'split' ? 'split' : 'mixed';
}

// 外部フィードの日付は不正値を含み得るため、比較可能な値だけを採用する。
function parsePublishedAt(...candidates) {
    for (const candidate of candidates) {
        if (!candidate) continue;

        const timestamp = Date.parse(candidate);
        if (Number.isFinite(timestamp)) return timestamp;
    }

    return null;
}

// 同じ記事に付いた計測用パラメータを除去し、重複判定を安定させる。
function normalizeArticleUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        if (!['http:', 'https:'].includes(url.protocol)) return '';

        url.hash = '';
        [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'gclid',
            'fbclid'
        ].forEach(key => url.searchParams.delete(key));

        return url.toString();
    } catch (error) {
        return '';
    }
}

// フィードURLをログやキャッシュの識別に使える短い非可逆キーへ変換する。
function createFeedKey(value) {
    const text = String(value || '');
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `feed-${(hash >>> 0).toString(16)}`;
}

// RSS / Atom固有の項目を、混合表示とフィード別表示で共通利用できる形へ変換する。
function normalizeFeedItem(item, context) {
    const publishedAt = parsePublishedAt(item.pubDate, item.published, item.updated);
    const canonicalUrl = normalizeArticleUrl(item.link);
    const title = String(item.title || 'No Title').trim() || 'No Title';
    const description = String(item.description || item.content || '');
    const sourceFeedUrl = String(context.feedUrl || '');
    const sourceFeedTitle = String(context.feedTitle || context.feedHostname || '不明なフィード');
    const fallbackId = `${sourceFeedUrl}:${title}:${publishedAt ?? ''}`;

    return {
        id: String(item.guid || canonicalUrl || fallbackId),
        guid: String(item.guid || ''),
        title,
        url: canonicalUrl,
        link: canonicalUrl,
        canonicalUrl,
        description,
        summaryHTML: description,
        thumbnail: resolveThumbnail(item, description),
        publishedAt,
        publishedLabel: publishedAt === null
            ? '日時不明'
            : new Date(publishedAt).toLocaleDateString('ja-JP'),
        dateStr: publishedAt === null
            ? '日時不明'
            : new Date(publishedAt).toLocaleDateString('ja-JP'),
        sourceFeedUrl,
        sourceFeedKey: context.feedKey,
        sourceFeedTitle,
        sourceOrder: context.sourceOrder,
        itemOrder: context.itemOrder
    };
}

// サムネイル項目がない場合だけ、本文中の先頭画像を表示候補として利用する。
function resolveThumbnail(item, description) {
    const directThumbnail = item.thumbnail || item.enclosure?.link || '';
    if (directThumbnail) return normalizeArticleUrl(directThumbnail);

    const match = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? normalizeArticleUrl(match[1]) : '';
}

// URL、GUID、複合キーの順で重複判定キーを決める。
function getDuplicateKey(article) {
    if (article.canonicalUrl) return `url:${article.canonicalUrl}`;
    if (article.guid) return `guid:${article.guid}`;
    return `fallback:${article.sourceFeedKey}:${article.title}:${article.publishedAt ?? ''}`;
}

// 情報量が多い記事を代表として残し、設定順を最後の決定条件にする。
function selectPreferredArticle(current, candidate) {
    // 1. 有効な公開日時を持つ記事を優先
    const currentHasDate = current.publishedAt !== null;
    const candidateHasDate = candidate.publishedAt !== null;
    if (currentHasDate !== candidateHasDate) {
        return candidateHasDate ? candidate : current;
    }

    // 2. 説明文を持つ記事を優先
    const currentHasDesc = Boolean(current.description);
    const candidateHasDesc = Boolean(candidate.description);
    if (currentHasDesc !== candidateHasDesc) {
        return candidateHasDesc ? candidate : current;
    }

    // 3. サムネイルを持つ記事を優先
    const currentHasThumb = Boolean(current.thumbnail);
    const candidateHasThumb = Boolean(candidate.thumbnail);
    if (currentHasThumb !== candidateHasThumb) {
        return candidateHasThumb ? candidate : current;
    }

    // 4. 設定順が先のフィードの記事を優先
    return candidate.sourceOrder < current.sourceOrder ? candidate : current;
}

// 複数フィードに同じ記事が含まれても、混合一覧へ重複表示しない。
function deduplicateArticles(articles) {
    const uniqueArticles = new Map();

    articles.forEach((article) => {
        const key = getDuplicateKey(article);
        const current = uniqueArticles.get(key);
        uniqueArticles.set(key, current ? selectPreferredArticle(current, article) : article);
    });

    return Array.from(uniqueArticles.values());
}

// 同一入力なら毎回同じ順序になるよう、日時以外の比較条件も固定する。
function sortArticles(articles) {
    return [...articles].sort((left, right) => {
        if (left.publishedAt === null && right.publishedAt !== null) return 1;
        if (left.publishedAt !== null && right.publishedAt === null) return -1;
        if (left.publishedAt !== right.publishedAt) {
            return (right.publishedAt ?? 0) - (left.publishedAt ?? 0);
        }
        if (left.sourceOrder !== right.sourceOrder) return left.sourceOrder - right.sourceOrder;
        if (left.itemOrder !== right.itemOrder) return left.itemOrder - right.itemOrder;
        return left.id.localeCompare(right.id);
    });
}

// 検索とお気に入り条件を同じ順序で適用し、表示モード間の結果差を防ぐ。
function filterArticles(articles, options = {}) {
    const query = String(options.query || '').trim().toLowerCase();
    const favoriteIds = new Set(options.favoriteIds || []);
    const favoritesOnly = Boolean(options.favoritesOnly);

    return articles.filter((article) => {
        if (favoritesOnly && !favoriteIds.has(article.id)) return false;
        if (!query) return true;
        return article.title.toLowerCase().includes(query)
            || article.sourceFeedTitle.toLowerCase().includes(query);
    });
}

// フィード別表示ではユーザーの設定順を維持し、各グループ内だけを時系列化する。
function groupArticlesBySource(articles) {
    const groups = new Map();

    articles.forEach((article) => {
        if (!groups.has(article.sourceFeedKey)) {
            groups.set(article.sourceFeedKey, {
                feedKey: article.sourceFeedKey,
                feedTitle: article.sourceFeedTitle,
                sourceOrder: article.sourceOrder,
                articles: []
            });
        }

        groups.get(article.sourceFeedKey).articles.push(article);
    });

    return Array.from(groups.values())
        .sort((left, right) => left.sourceOrder - right.sourceOrder)
        .map(group => ({ ...group, articles: sortArticles(group.articles) }));
}
})();
