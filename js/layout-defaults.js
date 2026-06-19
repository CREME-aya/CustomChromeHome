// ==========================================
// ウィジェット初期配置の計算
// ==========================================
(function() {
window.LayoutDefaults = {
    calculateWidgetPositions
};

function toPx(value) {
    return `${value}px`;
}

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

    // TodoとクイックリンクはAIパネルの段数に合わせて下へ逃がす。
    const nextTop = calculateUtilityTop(containerWidth, aiTop);
    const utilRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    const utilStartX = Math.max(0, (containerWidth - utilRowWidth) / 2);
    positions['widget-todo'] = {
        position: 'absolute',
        left: `${utilStartX}px`,
        top: `${nextTop}px`,
        width: normalWidthPx
    };
    positions['widget-quick-links'] = {
        position: 'absolute',
        left: `${utilStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        top: `${nextTop}px`,
        width: normalWidthPx
    };

    const discoverTop = nextTop + WIDGET_UTILITY_HEIGHT + WIDGET_GAP;
    positions['widget-discover'] = {
        position: 'absolute',
        left: `${centerXWide}px`,
        top: `${discoverTop}px`,
        width: wideWidthPx
    };

    return positions;
}

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
