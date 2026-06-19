// ==========================================
// ウィジェット配置編集
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initWidgetSortable = initWidgetSortable;

// ==========================================
// initWidgetSortable — ウィジェットの自由配置（アブソリュート・ドラッグ）とピン留め、リサイズ
// ==========================================
// 詳細: 変数「activeDragElement」を、この後の処理で使う値として用意する。
let activeDragElement = null;
// 詳細: 変数「dragStartX」を、この後の処理で使う値として用意する。
let dragStartX = 0;
// 詳細: 変数「dragStartY」を、この後の処理で使う値として用意する。
let dragStartY = 0;
// 詳細: 変数「elementStartX」を、この後の処理で使う値として用意する。
let elementStartX = 0;
// 詳細: 変数「elementStartY」を、この後の処理で使う値として用意する。
let elementStartY = 0;

// 詳細: 関数「initWidgetSortable」の処理ブロックを開始する。
function initWidgetSortable() {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    const container = document.getElementById('dashboard-main');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!container) return;

    // 1. 各ウィジェットの初期化（ドラッグ有効化、ピン留めボタン追加、状態復元）
    // 詳細: 次の処理行「restoreWidgetStates(container);」の役割を、その場の制御フローに組み込む。
    restoreWidgetStates(container);

    // 2. 編集モードトグルの監視
    // 詳細: 変数「editModeToggle」を、この後の処理で使う値として用意する。
    const editModeToggle = document.getElementById('toggle-edit-mode');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (editModeToggle) {
        // 詳細: 変数「applyEditMode」を、この後の処理で使う値として用意する。
        const applyEditMode = () => {
            // 詳細: 変数「isEnabled」を、この後の処理で使う値として用意する。
            const isEnabled = editModeToggle.checked;
            // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
            container.classList.toggle('layout-edit-active', isEnabled);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        };
        // 詳細: 次の処理行「applyEditMode();」の役割を、その場の制御フローに組み込む。
        applyEditMode();
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        editModeToggle.addEventListener('change', applyEditMode);
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 3. ウィンドウリサイズ時の境界制御
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    window.addEventListener('resize', handleWindowResize);

    // 4. 編集モード時のみサイズ変更の完了を検知して保存する処理
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    container.addEventListener('mouseup', (e) => {
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!editModeToggle || !editModeToggle.checked) return;
        // 詳細: 変数「item」を、この後の処理で使う値として用意する。
        const item = e.target.closest('.sortable-item');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (item) {
            // 詳細: 次の処理行「saveWidgetState(item);」の役割を、その場の制御フローに組み込む。
            saveWidgetState(item);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 状態（座標、ピン留め、サイズ）の保存
// 詳細: 関数「saveWidgetState」の処理ブロックを開始する。
function saveWidgetState(el) {
    // 詳細: 変数「id」を、この後の処理で使う値として用意する。
    const id = el.getAttribute('data-id');
    // 詳細: 変数「states」を、この後の処理で使う値として用意する。
    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});

    // 詳細: 次の処理行「states[id] = {」の役割を、その場の制御フローに組み込む。
    states[id] = {
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        left: el.style.left,
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        top: el.style.top,
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        width: el.style.width,
        // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
        height: el.style.height,
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        pinned: el.classList.contains('widget-pinned')
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 詳細: 次の処理行「writeJsonToStorage(STORAGE_KEY_WIDGET_STATES, states);」の役割を、その場の制御フローに組み込む。
    writeJsonToStorage(STORAGE_KEY_WIDGET_STATES, states);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 状態の復元および自動配置
// 詳細: 関数「restoreWidgetStates」の処理ブロックを開始する。
function restoreWidgetStates(container) {
    // 詳細: 変数「states」を、この後の処理で使う値として用意する。
    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
    // 詳細: 変数「widgets」を、この後の処理で使う値として用意する。
    const widgets = Array.from(container.querySelectorAll('.sortable-item'));
    // 詳細: 変数「containerWidth」を、この後の処理で使う値として用意する。
    const containerWidth = container.clientWidth || 1200;

    // デフォルト位置の計算
    // 詳細: 変数「defaultPositions」を、この後の処理で使う値として用意する。
    const defaultPositions = window.LayoutDefaults.calculateWidgetPositions(containerWidth);

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    widgets.forEach((el) => {
        // 詳細: 変数「id」を、この後の処理で使う値として用意する。
        const id = el.getAttribute('data-id');
        // 詳細: 変数「state」を、この後の処理で使う値として用意する。
        const state = states[id];

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (state && (state.left || state.top)) {
            // 保存された位置・サイズを復元
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.position = state.pinned ? 'fixed' : 'absolute';
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.left = state.left;
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.top = state.top;
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (state.width) el.style.width = state.width;
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (state.height) el.style.height = state.height;
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (state.pinned) {
                // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
                el.classList.add('widget-pinned');
            // 詳細: オブジェクトまたはブロックの境界を定義する。
            } else {
                // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
                el.classList.remove('widget-pinned');
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else {
            // 保存座標がない場合は、デフォルト配置を適用
            // 詳細: 変数「def」を、この後の処理で使う値として用意する。
            const def = defaultPositions[id];
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (def) {
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.position = def.position;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.left = def.left;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.top = def.top;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.width = def.width;
                // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
                if (def.pinned) {
                    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
                    el.classList.add('widget-pinned');
                // 詳細: オブジェクトまたはブロックの境界を定義する。
                } else {
                    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
                    el.classList.remove('widget-pinned');
                // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
                }
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「addPinButton(el);」の役割を、その場の制御フローに組み込む。
        addPinButton(el);
        // 詳細: 次の処理行「makeElementDraggable(el, container);」の役割を、その場の制御フローに組み込む。
        makeElementDraggable(el, container);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ピン留めボタンの自動生成・制御
// 詳細: 関数「addPinButton」の処理ブロックを開始する。
function addPinButton(el) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (el.querySelector('.widget-pin-btn')) return;

    // 詳細: 変数「btn」を、この後の処理で使う値として用意する。
    const btn = document.createElement('button');
    // 詳細: 次の処理行「btn.className = 'widget-pin-btn';」の役割を、その場の制御フローに組み込む。
    btn.className = 'widget-pin-btn';
    // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
    btn.innerHTML = el.classList.contains('widget-pinned') ? '固定中' : '固定する';
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (el.classList.contains('widget-pinned')) {
        // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
        btn.classList.add('active');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    btn.addEventListener('click', (e) => {
        // 詳細: 次の処理行「e.stopPropagation();」の役割を、その場の制御フローに組み込む。
        e.stopPropagation();
        // 詳細: 変数「isPinned」を、この後の処理で使う値として用意する。
        const isPinned = el.classList.toggle('widget-pinned');

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isPinned) {
            // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
            btn.innerHTML = '固定中';
            // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
            btn.classList.add('active');

            // absoluteからfixedへ切り替え (ウィンドウ相対)
            // 詳細: 変数「rect」を、この後の処理で使う値として用意する。
            const rect = el.getBoundingClientRect();
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.position = 'fixed';
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.left = `${rect.left}px`;
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.top = `${rect.top}px`;
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else {
            // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
            btn.innerHTML = '固定する';
            // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
            btn.classList.remove('active');

            // fixedからabsoluteへ切り替え (コンテナ相対)
            // 詳細: 変数「rect」を、この後の処理で使う値として用意する。
            const rect = el.getBoundingClientRect();
            // 詳細: 変数「containerRect」を、この後の処理で使う値として用意する。
            const containerRect = document.getElementById('dashboard-main').getBoundingClientRect();
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.position = 'absolute';
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.left = `${rect.left - containerRect.left}px`;
            // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
            el.style.top = `${rect.top - containerRect.top}px`;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「saveWidgetState(el);」の役割を、その場の制御フローに組み込む。
        saveWidgetState(el);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
    el.appendChild(btn);
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ウィジェットをドラッグ可能にする
// 詳細: 関数「makeElementDraggable」の処理ブロックを開始する。
function makeElementDraggable(el, container) {
    // 掴みやすくするため、ヘッダー領域またはウィジェット全体をドラッグ対象にする
    // 詳細: 変数「handler」を、この後の処理で使う値として用意する。
    const handler = el.querySelector('.widget-header') || el.querySelector('.clock-widget') || el;

    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    handler.addEventListener('mousedown', (e) => {
        // 詳細: 変数「editModeToggle」を、この後の処理で使う値として用意する。
        const editModeToggle = document.getElementById('toggle-edit-mode');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!editModeToggle || !editModeToggle.checked) return;

        // 入力フォームやクリック可能な要素へのクリック時はドラッグをスキップ
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A', 'SPAN'].includes(e.target.tagName)) {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (e.target.classList.contains('widget-pin-btn')) return; // ピン留め自体は許可
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // リサイズ領域（右下隅）のクリックかどうかをチェックして、リサイズ時はドラッグを開始しない
        // 詳細: 変数「rect」を、この後の処理で使う値として用意する。
        const rect = el.getBoundingClientRect();
        // 詳細: 変数「clickX」を、この後の処理で使う値として用意する。
        const clickX = e.clientX - rect.left;
        // 詳細: 変数「clickY」を、この後の処理で使う値として用意する。
        const clickY = e.clientY - rect.top;

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (clickX > rect.width - RESIZE_ZONE_PX && clickY > rect.height - RESIZE_ZONE_PX) {
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return; // リサイズ操作を優先
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「activeDragElement = el;」の役割を、その場の制御フローに組み込む。
        activeDragElement = el;
        // 詳細: 次の処理行「e.preventDefault();」の役割を、その場の制御フローに組み込む。
        e.preventDefault();

        // 詳細: 変数「containerRect」を、この後の処理で使う値として用意する。
        const containerRect = container.getBoundingClientRect();

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (el.classList.contains('widget-pinned')) {
            // 詳細: 次の処理行「elementStartX = rect.left;」の役割を、その場の制御フローに組み込む。
            elementStartX = rect.left;
            // 詳細: 次の処理行「elementStartY = rect.top;」の役割を、その場の制御フローに組み込む。
            elementStartY = rect.top;
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else {
            // 詳細: 次の処理行「elementStartX = rect.left - containerRect.left;」の役割を、その場の制御フローに組み込む。
            elementStartX = rect.left - containerRect.left;
            // 詳細: 次の処理行「elementStartY = rect.top - containerRect.top;」の役割を、その場の制御フローに組み込む。
            elementStartY = rect.top - containerRect.top;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 次の処理行「dragStartX = e.clientX;」の役割を、その場の制御フローに組み込む。
        dragStartX = e.clientX;
        // 詳細: 次の処理行「dragStartY = e.clientY;」の役割を、その場の制御フローに組み込む。
        dragStartY = e.clientY;

        // 詳細: ページ全体のイベントを監視して、初期化や操作処理を開始する。
        document.addEventListener('mousemove', onMouseMove);
        // 詳細: ページ全体のイベントを監視して、初期化や操作処理を開始する。
        document.addEventListener('mouseup', onMouseUp);
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「onMouseMove」の処理ブロックを開始する。
function onMouseMove(e) {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!activeDragElement) return;

    // 詳細: 変数「dx」を、この後の処理で使う値として用意する。
    const dx = e.clientX - dragStartX;
    // 詳細: 変数「dy」を、この後の処理で使う値として用意する。
    const dy = e.clientY - dragStartY;

    // 詳細: 変数「newX」を、この後の処理で使う値として用意する。
    const newX = elementStartX + dx;
    // 詳細: 変数「newY」を、この後の処理で使う値として用意する。
    const newY = elementStartY + dy;

    // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
    activeDragElement.style.left = `${newX}px`;
    // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
    activeDragElement.style.top = `${newY}px`;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 詳細: 関数「onMouseUp」の処理ブロックを開始する。
function onMouseUp() {
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!activeDragElement) return;

    // 詳細: 次の処理行「saveWidgetState(activeDragElement);」の役割を、その場の制御フローに組み込む。
    saveWidgetState(activeDragElement);

    // 詳細: 次の処理行「document.removeEventListener('mousemove', onMouseMove);」の役割を、その場の制御フローに組み込む。
    document.removeEventListener('mousemove', onMouseMove);
    // 詳細: 次の処理行「document.removeEventListener('mouseup', onMouseUp);」の役割を、その場の制御フローに組み込む。
    document.removeEventListener('mouseup', onMouseUp);
    // 詳細: 次の処理行「activeDragElement = null;」の役割を、その場の制御フローに組み込む。
    activeDragElement = null;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ウィンドウリサイズ時の境界制御＆デフォルト配置ウィジェットの再計算
// 詳細: 関数「handleWindowResize」の処理ブロックを開始する。
function handleWindowResize() {
    // 詳細: 変数「container」を、この後の処理で使う値として用意する。
    const container = document.getElementById('dashboard-main');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (!container) return;
    // 詳細: 変数「containerWidth」を、この後の処理で使う値として用意する。
    const containerWidth = container.clientWidth;

    // 詳細: 変数「states」を、この後の処理で使う値として用意する。
    const states = readJsonFromStorage(STORAGE_KEY_WIDGET_STATES, {});
    // 詳細: 変数「defaultPositions」を、この後の処理で使う値として用意する。
    const defaultPositions = window.LayoutDefaults.calculateWidgetPositions(containerWidth);

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    container.querySelectorAll('.sortable-item').forEach(el => {
        // 詳細: 変数「id」を、この後の処理で使う値として用意する。
        const id = el.getAttribute('data-id');
        // 詳細: 変数「state」を、この後の処理で使う値として用意する。
        const state = states[id];

        // ユーザーがドラッグして位置が保存されている場合
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (state && (state.left || state.top)) {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (el.classList.contains('widget-pinned')) return;

            // 詳細: 変数「left」を、この後の処理で使う値として用意する。
            const left = parseFloat(el.style.left) || 0;
            // 詳細: 変数「width」を、この後の処理で使う値として用意する。
            const width = el.clientWidth;

            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (left + width > containerWidth) {
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.left = `${Math.max(0, containerWidth - width)}px`;
                // 詳細: 次の処理行「saveWidgetState(el);」の役割を、その場の制御フローに組み込む。
                saveWidgetState(el);
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } else {
            // 位置が保存されていない（初期状態の）ウィジェットは、リサイズに合わせて再計算
            // 詳細: 変数「def」を、この後の処理で使う値として用意する。
            const def = defaultPositions[id];
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (def) {
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.position = def.position;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.left = def.left;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.top = def.top;
                // 詳細: インラインスタイルを更新して、要素の表示位置や見た目を調整する。
                el.style.width = def.width;
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
