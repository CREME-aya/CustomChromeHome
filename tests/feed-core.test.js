(function() {
function runFeedCoreTests() {
    const core = window.FeedCore;
    let testCount = 0;
    let failedCount = 0;

    function test(name, fn) {
        testCount += 1;
        try {
            fn();
        } catch (error) {
            failedCount += 1;
            console.error(`Test [${name}] failed:`, error);
        }
    }

    // 1. 不正な保存モードの補正 (normalizeDisplayMode)
    test('normalizeDisplayMode should keep valid modes and fallback to mixed', () => {
        assertEqual(core.normalizeDisplayMode('mixed'), 'mixed');
        assertEqual(core.normalizeDisplayMode('split'), 'split');
        assertEqual(core.normalizeDisplayMode('invalid'), 'mixed');
        assertEqual(core.normalizeDisplayMode(null), 'mixed');
    });

    // 2. 日時形式ごとのpublishedAt変換と不正日時のnull化 (parsePublishedAt)
    test('parsePublishedAt should parse valid dates and return null for invalid ones', () => {
        // 有効な日付
        const t1 = Date.parse('2026-06-25T16:00:00Z');
        assertEqual(core.parsePublishedAt('2026-06-25T16:00:00Z'), t1);
        assertEqual(core.parsePublishedAt(null, '2026-06-25T16:00:00Z'), t1);

        // 無効な日付
        assertEqual(core.parsePublishedAt('invalid date'), null);
        assertEqual(core.parsePublishedAt('', null), null);
    });

    // 3. URLフラグメントとトラッキングパラメータ除去 (normalizeArticleUrl)
    test('normalizeArticleUrl should strip tracking params and fragments, and lowercase hostname', () => {
        assertEqual(
            core.normalizeArticleUrl('https://EXAMPLE.com/path?utm_source=rss&utm_medium=email&q=1#fragment'),
            'https://example.com/path?q=1'
        );
        assertEqual(
            core.normalizeArticleUrl('https://example.com/path?gclid=123&fbclid=456&utm_campaign=xyz'),
            'https://example.com/path'
        );
        // 不正なプロトコルは空文字
        assertEqual(core.normalizeArticleUrl('javascript:alert(1)'), '');
        assertEqual(core.normalizeArticleUrl('data:text/html,abc'), '');
        assertEqual(core.normalizeArticleUrl('http://example.com'), 'http://example.com/');
    });

    // 4. URL、GUID、複合キーによる重複判定 (deduplicateArticles)
    test('deduplicateArticles should deduplicate by URL, GUID, and fallback key', () => {
        const articles = [
            // URLでの重複
            { id: '1', canonicalUrl: 'https://example.com/a', guid: 'g1', publishedAt: 100, sourceOrder: 0, description: 'a', thumbnail: 't' },
            { id: '2', canonicalUrl: 'https://example.com/a', guid: 'g2', publishedAt: 100, sourceOrder: 1, description: 'b', thumbnail: 't' },
            // GUIDでの重複 (URLなし、GUID同一)
            { id: '3', canonicalUrl: '', guid: 'g3', publishedAt: 200, sourceOrder: 0, description: 'c', thumbnail: '' },
            { id: '4', canonicalUrl: '', guid: 'g3', publishedAt: 200, sourceOrder: 1, description: 'c', thumbnail: '' },
            // Fallbackでの重複 (URLもGUIDも空で、sourceFeedKey + title + publishedAt が同じ)
            { id: '5', canonicalUrl: '', guid: '', title: 'Title A', publishedAt: 300, sourceFeedKey: 'feed1', sourceOrder: 0, description: 'd', thumbnail: '' },
            { id: '6', canonicalUrl: '', guid: '', title: 'Title A', publishedAt: 300, sourceFeedKey: 'feed1', sourceOrder: 1, description: 'e', thumbnail: '' }
        ];

        const result = core.deduplicateArticles(articles);
        assertEqual(result.length, 3);
        // 代表が正しく残っているか（sourceOrderが小さい方が残る）
        assertEqual(result.some(a => a.id === '1'), true);
        assertEqual(result.some(a => a.id === '3'), true);
        assertEqual(result.some(a => a.id === '5'), true);
    });

    // 5. 重複代表記事の優先順位 (selectPreferredArticle / deduplicateArticles)
    // 優先順: 1. 有効な日時を持つ記事 2. 説明文を持つ記事 3. サムネイルを持つ記事 4. 設定順が先のフィード
    test('deduplicateHeuristics should respect strict completeness criteria priority', () => {
        // ケースA: 片方だけ日付がある場合、日付ありが優先（他がなくても）
        const a1 = { id: 'a1', canonicalUrl: 'https://example.com/a', guid: '', publishedAt: 100, sourceOrder: 1, description: '', thumbnail: '' };
        const a2 = { id: 'a2', canonicalUrl: 'https://example.com/a', guid: '', publishedAt: null, sourceOrder: 0, description: 'Desc', thumbnail: 'Thumb' };
        assertEqual(core.deduplicateArticles([a1, a2])[0].id, 'a1');

        // ケースB: 日付有無が同じで、片方だけ説明がある場合、説明ありが優先
        const b1 = { id: 'b1', canonicalUrl: 'https://example.com/b', guid: '', publishedAt: 100, sourceOrder: 1, description: 'Desc', thumbnail: '' };
        const b2 = { id: 'b2', canonicalUrl: 'https://example.com/b', guid: '', publishedAt: 100, sourceOrder: 0, description: '', thumbnail: 'Thumb' };
        assertEqual(core.deduplicateArticles([b1, b2])[0].id, 'b1');

        // ケースC: 日付・説明有無が同じで、片方だけサムネイルがある場合、サムネイルありが優先
        const c1 = { id: 'c1', canonicalUrl: 'https://example.com/c', guid: '', publishedAt: 100, sourceOrder: 1, description: 'Desc', thumbnail: 'Thumb' };
        const c2 = { id: 'c2', canonicalUrl: 'https://example.com/c', guid: '', publishedAt: 100, sourceOrder: 0, description: 'Desc', thumbnail: '' };
        assertEqual(core.deduplicateArticles([c1, c2])[0].id, 'c1');

        // ケースD: 日付・説明・サムネイル有無がすべて同じなら、sourceOrderが小さい方が優先
        const d1 = { id: 'd1', canonicalUrl: 'https://example.com/d', guid: '', publishedAt: 100, sourceOrder: 1, description: 'Desc', thumbnail: 'Thumb' };
        const d2 = { id: 'd2', canonicalUrl: 'https://example.com/d', guid: '', publishedAt: 100, sourceOrder: 0, description: 'Desc', thumbnail: 'Thumb' };
        assertEqual(core.deduplicateArticles([d1, d2])[0].id, 'd2');
    });

    // 6. 同一日時の安定ソートと日時不明記事の末尾配置 (sortArticles)
    test('sortArticles should perform stable sort and place null date articles at the end', () => {
        const list = [
            { id: 'null-1', publishedAt: null, sourceOrder: 0, itemOrder: 0 },
            { id: 'date-100', publishedAt: 100, sourceOrder: 1, itemOrder: 0 },
            { id: 'date-200-a', publishedAt: 200, sourceOrder: 0, itemOrder: 0 },
            { id: 'date-200-b', publishedAt: 200, sourceOrder: 1, itemOrder: 0 },
            { id: 'null-2', publishedAt: null, sourceOrder: 1, itemOrder: 0 }
        ];

        const sorted = core.sortArticles(list);
        assertEqual(sorted[0].id, 'date-200-a'); // 日付最新
        assertEqual(sorted[1].id, 'date-200-b'); // 同日付ならsourceOrderが若い順
        assertEqual(sorted[2].id, 'date-100');   // 古い日付
        assertEqual(sorted[3].id, 'null-1');     // 日付なしは後ろ
        assertEqual(sorted[4].id, 'null-2');     // 日付なしの中でsourceOrderが若い順
    });

    // 7. グループ化とソート (groupArticlesBySource)
    test('groupArticlesBySource should group articles and order groups by sourceOrder', () => {
        const list = [
            { id: '1', sourceFeedKey: 'feed-b', sourceFeedTitle: 'B', sourceOrder: 1, itemOrder: 0, publishedAt: 100 },
            { id: '2', sourceFeedKey: 'feed-a', sourceFeedTitle: 'A', sourceOrder: 0, itemOrder: 0, publishedAt: 200 },
            { id: '3', sourceFeedKey: 'feed-b', sourceFeedTitle: 'B', sourceOrder: 1, itemOrder: 1, publishedAt: 300 }
        ];

        const groups = core.groupArticlesBySource(list);
        assertEqual(groups.length, 2);
        assertEqual(groups[0].feedKey, 'feed-a'); // sourceOrderが0なので先
        assertEqual(groups[1].feedKey, 'feed-b'); // sourceOrderが1なので後

        // グループ内も日付順でソートされていること
        assertEqual(groups[1].articles[0].id, '3'); // publishedAtが300なので先
        assertEqual(groups[1].articles[1].id, '1'); // publishedAtが100なので後
    });

    // 8. フィルタ (filterArticles)
    test('filterArticles should filter by query and favorites', () => {
        const list = [
            { id: '1', title: 'Qiita article', sourceFeedTitle: 'Qiita', publishedAt: 100 },
            { id: '2', title: 'Zenn article', sourceFeedTitle: 'Zenn', publishedAt: 200 },
            { id: '3', title: 'Another Qiita article', sourceFeedTitle: 'Qiita', publishedAt: 300 }
        ];

        // クエリによる検索（大文字小文字無視、タイトルと出典）
        assertEqual(core.filterArticles(list, { query: 'qiita' }).length, 2);
        assertEqual(core.filterArticles(list, { query: 'zenn' }).length, 1);
        assertEqual(core.filterArticles(list, { query: 'another' }).length, 1);

        // お気に入りフィルタ
        assertEqual(core.filterArticles(list, { favoritesOnly: true, favoriteIds: ['2'] }).length, 1);
        assertEqual(core.filterArticles(list, { favoritesOnly: true, favoriteIds: ['2'] })[0].id, '2');
    });

    return {
        passed: failedCount === 0,
        total: testCount,
        failed: failedCount
    };
}

function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

window.runFeedCoreTests = runFeedCoreTests;
})();
