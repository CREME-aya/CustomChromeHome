// ==========================================
// ウィジェット初期配置の計算
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.LayoutDefaults = {
    // 詳細: 次の処理行「calculateWidgetPositions」の役割を、その場の制御フローに組み込む。
    calculateWidgetPositions
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
};

// 詳細: 関数「toPx」の処理ブロックを開始する。
function toPx(value) {
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return `${value}px`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「calculateWidgetPositions」の処理ブロックを開始する。
function calculateWidgetPositions(containerWidth) {
    // 詳細: 変数「positions」を、この後の処理で使う値として用意する。
    const positions = {};
    // 詳細: 変数「normalWidthPx」を、この後の処理で使う値として用意する。
    const normalWidthPx = toPx(WIDGET_WIDTH_NORMAL);
    // 詳細: 変数「wideWidthPx」を、この後の処理で使う値として用意する。
    const wideWidthPx = toPx(WIDGET_WIDTH_WIDE);

    // Spotifyは常時アクセスしやすいよう、画面右上へ固定配置する。
    // 詳細: 次の処理行「positions['widget-spotify'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-spotify'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'fixed',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `calc(100% - ${toPx(WIDGET_SPOTIFY_RIGHT_OFFSET)})`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: toPx(WIDGET_SPOTIFY_TOP),
        // 詳細: オブジェクトのプロパティ値を定義する。
        width: normalWidthPx,
        // 詳細: 次の処理行「pinned: true」の役割を、その場の制御フローに組み込む。
        pinned: true
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 時計と天気は上段中央に横並びで置く。
    // 詳細: 変数「topRowWidth」を、この後の処理で使う値として用意する。
    const topRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    // 詳細: 変数「topRowStartX」を、この後の処理で使う値として用意する。
    const topRowStartX = Math.max(0, (containerWidth - topRowWidth) / 2);
    // 詳細: 次の処理行「positions['widget-clock'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-clock'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${topRowStartX}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: toPx(WIDGET_TOP_MARGIN),
        // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
        width: normalWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
    // 詳細: 次の処理行「positions['widget-weather'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-weather'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${topRowStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: toPx(WIDGET_TOP_MARGIN),
        // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
        width: normalWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 検索欄とDiscoverは幅広ウィジェットとして中央に揃える。
    // 詳細: 変数「centerXWide」を、この後の処理で使う値として用意する。
    const centerXWide = Math.max(0, (containerWidth - WIDGET_WIDTH_WIDE) / 2);
    // 詳細: 変数「searchTop」を、この後の処理で使う値として用意する。
    const searchTop = WIDGET_TOP_MARGIN + WIDGET_CLOCK_WEATHER_HEIGHT + WIDGET_GAP;
    // 詳細: 次の処理行「positions['widget-ai-search'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-ai-search'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${centerXWide}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: `${searchTop}px`,
        // 詳細: 次の処理行「width: wideWidthPx」の役割を、その場の制御フローに組み込む。
        width: wideWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // AIパネルは画面幅に応じて3列、2列、1列へ切り替える。
    // 詳細: 変数「aiTop」を、この後の処理で使う値として用意する。
    const aiTop = searchTop + WIDGET_SEARCH_HEIGHT + WIDGET_GAP;
    // 詳細: 次の処理行「Object.assign(positions, calculateAiPanelPositions(containerWidth, aiTop, normalWidthPx));」の役割を、その場の制御フローに組み込む。
    Object.assign(positions, calculateAiPanelPositions(containerWidth, aiTop, normalWidthPx));

    // TodoとクイックリンクはAIパネルの段数に合わせて下へ逃がす。
    // 詳細: 変数「nextTop」を、この後の処理で使う値として用意する。
    const nextTop = calculateUtilityTop(containerWidth, aiTop);
    // 詳細: 変数「utilRowWidth」を、この後の処理で使う値として用意する。
    const utilRowWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_GROUP_GAP;
    // 詳細: 変数「utilStartX」を、この後の処理で使う値として用意する。
    const utilStartX = Math.max(0, (containerWidth - utilRowWidth) / 2);
    // 詳細: 次の処理行「positions['widget-todo'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-todo'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${utilStartX}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: `${nextTop}px`,
        // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
        width: normalWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
    // 詳細: 次の処理行「positions['widget-quick-links'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-quick-links'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${utilStartX + WIDGET_WIDTH_NORMAL + WIDGET_GROUP_GAP}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: `${nextTop}px`,
        // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
        width: normalWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 詳細: 変数「discoverTop」を、この後の処理で使う値として用意する。
    const discoverTop = nextTop + WIDGET_UTILITY_HEIGHT + WIDGET_GAP;
    // 詳細: 次の処理行「positions['widget-discover'] = {」の役割を、その場の制御フローに組み込む。
    positions['widget-discover'] = {
        // 詳細: オブジェクトのプロパティ値を定義する。
        position: 'absolute',
        // 詳細: オブジェクトのプロパティ値を定義する。
        left: `${centerXWide}px`,
        // 詳細: オブジェクトのプロパティ値を定義する。
        top: `${discoverTop}px`,
        // 詳細: 次の処理行「width: wideWidthPx」の役割を、その場の制御フローに組み込む。
        width: wideWidthPx
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return positions;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「calculateAiPanelPositions」の処理ブロックを開始する。
function calculateAiPanelPositions(containerWidth, aiTop, normalWidthPx) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (containerWidth >= WIDGET_THREE_COLUMN_MIN_WIDTH) {
        // 十分な幅がある場合は3モデルを同じ行に並べる。
        // 詳細: 変数「aiStartX」を、この後の処理で使う値として用意する。
        const aiStartX = Math.max(0, (containerWidth - WIDGET_THREE_COLUMN_MIN_WIDTH) / 2);
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return {
            // 詳細: 次の処理行「'widget-ai-openai': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-openai': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${aiStartX}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
            },
            // 詳細: 次の処理行「'widget-ai-anthropic': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-anthropic': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
            },
            // 詳細: 次の処理行「'widget-ai-gemini': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-gemini': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${aiStartX + ((WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP) * 2)}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (containerWidth >= WIDGET_TWO_COLUMN_MIN_WIDTH) {
        // 中間幅では2列+1列にして、横スクロールを避ける。
        // 詳細: 変数「aiTwoColumnWidth」を、この後の処理で使う値として用意する。
        const aiTwoColumnWidth = (WIDGET_WIDTH_NORMAL * 2) + WIDGET_AI_PANEL_GAP;
        // 詳細: 変数「aiStartX」を、この後の処理で使う値として用意する。
        const aiStartX = Math.max(0, (containerWidth - aiTwoColumnWidth) / 2);
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return {
            // 詳細: 次の処理行「'widget-ai-openai': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-openai': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${aiStartX}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
            },
            // 詳細: 次の処理行「'widget-ai-anthropic': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-anthropic': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${aiStartX + WIDGET_WIDTH_NORMAL + WIDGET_AI_PANEL_GAP}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
            },
            // 詳細: 次の処理行「'widget-ai-gemini': {」の役割を、その場の制御フローに組み込む。
            'widget-ai-gemini': {
                // 詳細: オブジェクトのプロパティ値を定義する。
                position: 'absolute',
                // 詳細: オブジェクトのプロパティ値を定義する。
                left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
                // 詳細: オブジェクトのプロパティ値を定義する。
                top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
                // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
                width: normalWidthPx
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 狭い画面では縦積みにして各パネルの読みやすさを優先する。
    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return {
        // 詳細: 次の処理行「'widget-ai-openai': {」の役割を、その場の制御フローに組み込む。
        'widget-ai-openai': {
            // 詳細: オブジェクトのプロパティ値を定義する。
            position: 'absolute',
            // 詳細: オブジェクトのプロパティ値を定義する。
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            // 詳細: オブジェクトのプロパティ値を定義する。
            top: `${aiTop}px`,
            // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
            width: normalWidthPx
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 次の処理行「'widget-ai-anthropic': {」の役割を、その場の制御フローに組み込む。
        'widget-ai-anthropic': {
            // 詳細: オブジェクトのプロパティ値を定義する。
            position: 'absolute',
            // 詳細: オブジェクトのプロパティ値を定義する。
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            // 詳細: オブジェクトのプロパティ値を定義する。
            top: `${aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP}px`,
            // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
            width: normalWidthPx
        // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
        },
        // 詳細: 次の処理行「'widget-ai-gemini': {」の役割を、その場の制御フローに組み込む。
        'widget-ai-gemini': {
            // 詳細: オブジェクトのプロパティ値を定義する。
            position: 'absolute',
            // 詳細: オブジェクトのプロパティ値を定義する。
            left: `${Math.max(0, (containerWidth - WIDGET_WIDTH_NORMAL) / 2)}px`,
            // 詳細: オブジェクトのプロパティ値を定義する。
            top: `${aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2)}px`,
            // 詳細: 次の処理行「width: normalWidthPx」の役割を、その場の制御フローに組み込む。
            width: normalWidthPx
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「calculateUtilityTop」の処理ブロックを開始する。
function calculateUtilityTop(containerWidth, aiTop) {
    // AIパネルの使用行数に応じて、後続ウィジェットの開始位置を決める。
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (containerWidth < WIDGET_TWO_COLUMN_MIN_WIDTH) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 3);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (containerWidth < WIDGET_THREE_COLUMN_MIN_WIDTH) {
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return aiTop + ((WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP) * 2);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
    return aiTop + WIDGET_AI_PANEL_HEIGHT + WIDGET_GAP;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
