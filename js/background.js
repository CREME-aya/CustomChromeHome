// ==========================================
// initBackground — 背景画像設定（ランダム、カスタム、クリア）
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initBackground = initBackground;

// 詳細: 関数「initBackground」の処理ブロックを開始する。
function initBackground() {
    // 詳細: 変数「bgUrlInput」を、この後の処理で使う値として用意する。
    const bgUrlInput = document.getElementById('bg-url-input');
    // 詳細: 変数「bgFileInput」を、この後の処理で使う値として用意する。
    const bgFileInput = document.getElementById('local-bg-input') || document.getElementById('bg-file-input');
    // 詳細: 変数「saveBgBtn」を、この後の処理で使う値として用意する。
    const saveBgBtn = document.getElementById('save-bg-btn');
    // 詳細: 変数「clearBgBtn」を、この後の処理で使う値として用意する。
    const clearBgBtn = document.getElementById('clear-bg-btn');
    // 詳細: 変数「randomBgBtn」を、この後の処理で使う値として用意する。
    const randomBgBtn = document.getElementById('random-bg-btn');

    // 保存済み背景があれば、起動時にbodyへ直接適用する。
    // 詳細: 変数「savedBg」を、この後の処理で使う値として用意する。
    const savedBg = localStorage.getItem(STORAGE_KEY_BG);
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (savedBg) {
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        document.body.style.backgroundImage = `url(${savedBg})`;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「applyBackground」の処理ブロックを開始する。
    function applyBackground(imgUrl) {
        // Base64はサイズが大きい場合があるため、LocalStorageの容量制限に注意する。
        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // 詳細: ユーザー設定や状態を localStorage に保存する。
            localStorage.setItem(STORAGE_KEY_BG, imgUrl);
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            document.body.style.backgroundImage = `url(${imgUrl})`;
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (e) {
            // 詳細: 次の処理行「window.showNotification('画像の保存に失敗しました。ファイルサイズが大きすぎる可能性があります。', 'error');」の役割を、その場の制御フローに組み込む。
            window.showNotification('画像の保存に失敗しました。ファイルサイズが大きすぎる可能性があります。', 'error');
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    randomBgBtn?.addEventListener('click', () => {
        // プリセット背景はURLだけ保存し、拡張サイズを増やさない。
        // 詳細: 変数「randomUrl」を、この後の処理で使う値として用意する。
        const randomUrl = PRESET_BACKGROUNDS[Math.floor(Math.random() * PRESET_BACKGROUNDS.length)];
        // 詳細: 次の処理行「applyBackground(randomUrl);」の役割を、その場の制御フローに組み込む。
        applyBackground(randomUrl);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 関数「applySelectedBackground」の処理ブロックを開始する。
    function applySelectedBackground() {
        // 詳細: 変数「file」を、この後の処理で使う値として用意する。
        const file = bgFileInput?.files?.[0];
        // 詳細: 変数「bgUrl」を、この後の処理で使う値として用意する。
        const bgUrl = bgUrlInput?.value?.trim();
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (file) {
            // ローカル画像はFileReaderでData URL化して、拡張内だけで完結させる。
            // 詳細: 変数「reader」を、この後の処理で使う値として用意する。
            const reader = new FileReader();
            // 詳細: コールバック関数を定義し、後で呼ばれる処理内容を渡す。
            reader.onload = (e) => {
                // 詳細: 変数「dataUrl」を、この後の処理で使う値として用意する。
                const dataUrl = e.target.result;
                // 詳細: 次の処理行「applyBackground(dataUrl);」の役割を、その場の制御フローに組み込む。
                applyBackground(dataUrl);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            };
            // 詳細: 次の処理行「reader.readAsDataURL(file);」の役割を、その場の制御フローに組み込む。
            reader.readAsDataURL(file);
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else if (bgUrl) {
            // 詳細: 次の処理行「applyBackground(bgUrl);」の役割を、その場の制御フローに組み込む。
            applyBackground(bgUrl);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    saveBgBtn?.addEventListener('click', applySelectedBackground);
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    bgFileInput?.addEventListener('change', applySelectedBackground);

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    clearBgBtn?.addEventListener('click', () => {
        // 詳細: 不要になった保存済み状態を localStorage から削除する。
        localStorage.removeItem(STORAGE_KEY_BG);
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        document.body.style.backgroundImage = '';
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (bgUrlInput) bgUrlInput.value = '';
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (bgFileInput) bgFileInput.value = '';
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
