// ==========================================
// initWidgetToggles — ウィジェット表示トグル
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initWidgetToggles = initWidgetToggles;

// 詳細: 関数「initWidgetToggles」の処理ブロックを開始する。
function initWidgetToggles() {
    // 詳細: 変数「toggles」を、この後の処理で使う値として用意する。
    const toggles = [
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-clock', targetClass: 'clock-widget' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-weather', targetId: 'weather-widget' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-todo', targetId: 'todo-widget' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-spotify', targetId: 'spotify-widget' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-links', targetClass: 'quick-links-widget' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-ai-openai', targetId: 'ai-panel-openai' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-ai-anthropic', targetId: 'ai-panel-anthropic' },
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        { id: 'toggle-ai-gemini', targetId: 'ai-panel-gemini' }
    // 詳細: 配列リテラルの境界を定義する。
    ];

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    toggles.forEach(t => {
        // 詳細: 変数「checkbox」を、この後の処理で使う値として用意する。
        const checkbox = document.getElementById(t.id);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!checkbox) return;

        // 保存済みの表示状態をチェックボックスへ復元する。
        // 詳細: 変数「stored」を、この後の処理で使う値として用意する。
        const stored = localStorage.getItem(t.id);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (stored !== null) checkbox.checked = stored === 'true';

        // id指定とclass指定の両方に対応し、単体/複数ウィジェットを同じ処理で扱う。
        // 詳細: 変数「applyToggle」を、この後の処理で使う値として用意する。
        const applyToggle = () => {
            // 詳細: 変数「isVisible」を、この後の処理で使う値として用意する。
            const isVisible = checkbox.checked;
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (t.targetClass) {
                // 詳細: 複数の要素を順番に処理するための反復処理を行う。
                document.querySelectorAll('.' + t.targetClass).forEach(el => el.classList.toggle('hidden-widget', !isVisible));
            // 詳細: オブジェクトまたはブロックの境界を定義する。
            } else if (t.targetId) {
                // 詳細: 変数「el」を、この後の処理で使う値として用意する。
                const el = document.getElementById(t.targetId);
                // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
                if (el) el.classList.toggle('hidden-widget', !isVisible);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };
        // 詳細: 次の処理行「applyToggle();」の役割を、その場の制御フローに組み込む。
        applyToggle();

        // 変更時は表示状態を保存して、次回起動時にも同じ状態を再現する。
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        checkbox.addEventListener('change', () => {
            // 詳細: ユーザー設定や状態を localStorage に保存する。
            localStorage.setItem(t.id, checkbox.checked);
            // 詳細: 次の処理行「applyToggle();」の役割を、その場の制御フローに組み込む。
            applyToggle();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
