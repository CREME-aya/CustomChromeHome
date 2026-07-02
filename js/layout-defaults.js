// ==========================================
// ウィジェット初期配置の計算
// ==========================================
(function() {
window.LayoutDefaults = {
    calculateWidgetPositions
};

/**
 * 数値をピクセル単位の文字列に変換する
 * @param {number} value - 変換する数値
 * @returns {string} ピクセル単位の文字列 (例: '100px')
 */
function toPx(value) {
    return `${value}px`;
}

/**
 * コンテナ幅に基づいてウィジェットの初期配置を計算する
 * @param {number} containerWidth - コンテナの幅
 * @returns {Object} 各ウィジェットの位置情報を格納したオブジェクト
 */
function calculateWidgetPositions(containerWidth) {
    const positions = {};
    const normalWidthPx = toPx(WIDGET_WIDTH_NORMAL);
    const wideWidthPx = toPx(WIDGET_WIDTH_WIDE);

    // Spotifyは常時アクセスしやすいよう、画面右上へ固定配置する。
    positions['widget-spotify'] = {
        position: 'fixed',
        left: `calc(100% - ${toPx(WIDGET_SPOTIFY_RIGHT_OFFSET)})`,
        top: toPx(WIDGET_SPOTIFY_TOP),
        width: normalWidthPx,
        pinned: true
    };

    // 時計と天気は上段中央に横並びで置く。
    const topRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    const topRowStartX = Math.max(0, (containerWidth - topRowWidth) / 2);
    positions['widget-clock'] = {
        position: 'absolute',
        left: `${topRowStartX}px`,
        top: toPx(WIDGET_TOP_MARGIN),
        width: normalWidthPx
    };
    positions['widget-weather'] = {
        position: 'absolute',
        left: `${topRowStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        top: toPx(WIDGET_TOP_MARGIN),
        width: normalWidthPx
    };

    // 検索欄とDiscoverは幅広ウィジェットとして中央に揃える。
    const centerXWide = Math.max(0, (containerWidth - WIDGET_WIDTH_WIDE) / 2);
    const searchTop = WIDGET_TOP_MARGIN + WIDGET_CLOCK_WEATHER_HEIGHT + WIDGET_GAP;
    positions['widget-ai-search'] = {
        position: 'absolute',
        left: `${centerXWide}px`,
        top: `${searchTop}px`,
        width: wideWidthPx
    };

    // AIパネルは画面幅に応じて3列、2列、1列へ切り替える。
    const aiTop = searchTop + WIDGET_SEARCH_HEIGHT + WIDGET_GAP;
    Object.assign(positions, calculateAiPanelPositions(containerWidth, aiTop, normalWidthPx));

    // ノーマル幅ウィジェット（Todo、リンク、新ウィジェット）のグリッド配置
    const nextTop = calculateUtilityTop(containerWidth, aiTop);

    // グリッド配置対象のノーマル幅ウィジェット一覧
    const normalWidgets = [
        'widget-todo',
        'widget-unified-agenda',
        'widget-quick-links',
        'widget-google-calendar',
        'widget-google-tasks',
        'widget-gmail',
        'widget-github',
        'widget-stocks',
        'widget-github-grass',
        'widget-api-diagnostics'
    ];

    // 利用可能な幅に応じて列数を動的に決定 (1列から最大3列)
    const colWidth = WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP;
    let cols = Math.floor((containerWidth + WIDGET_GROUP_GAP) / colWidth);
    cols = Math.max(1, Math.min(cols, 3)); // 画面配置上、最大3列に制限

    const rowHeight = WIDGET_UTILITY_HEIGHT + WIDGET_GAP;
    const gridWidth = (cols * WIDGET_WIDTH_NORMAL) + ((cols - 1) * WIDGET_GROUP_GAP);
    const startX = Math.max(0, (containerWidth - gridWidth) / 2);

    normalWidgets.forEach((widgetId, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        positions[widgetId] = {
            position: 'absolute',
            left: `${startX + (col * colWidth)}px`,
            top: `${nextTop + (row * rowHeight)}px`,
            width: normalWidthPx
        };
    });

    // Discover (RSSフィードなど) はグリッドの段の最下部へ配置する
    const numRows = Math.ceil(normalWidgets.length / cols);
    const discoverTop = nextTop + (numRows * rowHeight);

    positions['widget-discover'] = {
        position: 'absolute',
        left: `${centerXWide}px`,
        top: `${discoverTop}px`,
        width: wideWidthPx
    };

    return positions;
}

/**
 * 画面幅に応じてAIパネル（OpenAI, Anthropic, Gemini）の配置を計算する
 * @param {number} containerWidth - コンテナの幅
 * @param {number} aiTop - AIパネルのY座標開始位置
 * @param {string} normalWidthPx - ノーマル幅ウィジェットのピクセル文字列
 * @returns {Object} AIパネル各ウィジェットの位置情報
 */
function calculateAiPanelPositions(containerWidth, aiTop, normalWidthPx) {
    if (containerWidth >= WIDGET_THREE_COLUMN_MIN_WIDTH) {
        // 十分な幅がある場合は3モデルを同じ行に並べる。
        const aiStartX = Math.max(0, (containerWidth - WIDGET_THREE_COLUMN_MIN_WIDTH) / 2);
        return {
            'widget-ai-openai': {
                position: 'absolute',
                left: `${aiStartX}px`,
                top: `${aiTop}px`,
                width: normalWidthPx
            },
            'widget-ai-anthropic': {
                position: 'absolute',
                left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
                top: `${aiTop}px`,
                width: normalWidthPx
            },
            'widget-ai-gemini': {
                position: 'absolute',
                left: `${aiStartX + ((WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP) * 2)}px`,
                top: `${aiTop}px`,
                width: normalWidthPx
            }
        };
    }

    if (containerWidth >= WIDGET_TWO_COLUMN_MIN_WIDTH) {
        // 中間幅では2列+1列にして、横スクロールを避ける。
        const aiTwoColumnWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_AI_PANEL_GAP;
        const aiStartX = Math.max(0, (containerWidth - aiTwoColumnWidth) / 2);
        return {
            'widget-ai-openai': {
                position: 'absolute',
                left: `${aiStartX}px`,
                top: `${aiTop}px`,
                width: normalWidthPx
            },
            'widget-ai-anthropic': {
                position: 'absolute',
                left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
                top: `${aiTop}px`,
                width: normalWidthPx
            },
            'widget-ai-gemini': {
                position: 'absolute',
                left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
                top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
                width: normalWidthPx
            }
        };
    }

    // 狭い画面では縦積みにして各パネルの読みやすさを優先する。
    return {
        'widget-ai-openai': {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop}px`,
            width: normalWidthPx
        },
        'widget-ai-anthropic': {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
            width: normalWidthPx
        },
        'widget-ai-gemini': {
            position: 'absolute',
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            top: `${aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2)}px`,
            width: normalWidthPx
        }
    };
}

/**
 * AIパネルより下に配置するウィジェットのY座標開始位置を計算する
 * @param {number} containerWidth - コンテナの幅
 * @param {number} aiTop - AIパネルのY座標開始位置
 * @returns {number} 後続ウィジェットのY座標開始位置
 */
function calculateUtilityTop(containerWidth, aiTop) {
    // AIパネルの使用行数に応じて、後続ウィジェットの開始位置を決める。
    if (containerWidth < WIDGET_TWO_COLUMN_MIN_WIDTH) {
        return aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 3);
    }

    if (containerWidth < WIDGET_THREE_COLUMN_MIN_WIDTH) {
        return aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2);
    }

    return aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP;
}
})();
