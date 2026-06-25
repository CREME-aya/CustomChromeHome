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
// 連続するresizeイベントを1描画につき1回へまとめ、不要な再計算を避ける。
// 詳細: 次回のリサイズ処理に対応するrequestAnimationFrameの識別子を保持する。
let resizeFrameId = null;

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
    window.addEventListener('resize', scheduleWindowResize);
    // 保存時とは異なる画面サイズで開いた場合も、DOM寸法の確定後に表示位置だけを補正する。
    // 詳細: 初回描画の次フレームで、復元済みウィジェットを現在の表示領域へ収める。
    scheduleWindowResize();

    // 4. 編集モード時のみサイズ変更の完了を検知して保存する処理
    // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
    container.addEventListener('mouseup', (e) => {
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!editModeToggle || !editModeToggle.checked) return;
        // 詳細: 変数「item」を、この後の処理で使う値として用意する。
        const item = e.target.closest('.sortable-item');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (item) {
            // 手動リサイズ後の寸法を基準に、操作できる位置へ戻してから保存する。
            // 詳細: ユーザーが確定したサイズと位置を、現在の表示領域内へ制限する。
            constrainWidgetToVisibleArea(item, container);
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
        // 座標系を切り替える前の画面上の位置を保持し、切り替え後のジャンプを防ぐ。
        // 詳細: ピン留め状態を変更する前のウィジェット位置と寸法を取得する。
        const rect = el.getBoundingClientRect();
        // 詳細: 変数「isPinned」を、この後の処理で使う値として用意する。
        const isPinned = el.classList.toggle('widget-pinned');

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isPinned) {
            // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
            btn.innerHTML = '固定中';
            // 詳細: CSSクラスを更新して、表示状態や見た目を切り替える。
            btn.classList.add('active');

            // absoluteからfixedへ切り替え (ウィンドウ相対)
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

        // 座標系を切り替えた結果が画面外へ出る場合は、表示可能な位置へ戻す。
        // 詳細: 現在のピン留め状態に対応する境界へ、ウィジェット位置を制限する。
        constrainWidgetToVisibleArea(el, document.getElementById('dashboard-main'));
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

    // ドラッグで画面外へ移動した場合は、操作可能な位置へ戻した結果を保存する。
    // 詳細: absolute配置の境界として使用するダッシュボード要素を取得する。
    const container = document.getElementById('dashboard-main');
    // 詳細: ダッシュボードが存在する場合だけ、ドラッグ後の座標を表示領域へ制限する。
    if (container) constrainWidgetToVisibleArea(activeDragElement, container);

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

// resizeイベントを描画フレーム単位へ集約し、連続リサイズ中のDOM計測回数を抑える。
// 詳細: 関数「scheduleWindowResize」の処理ブロックを開始する。
function scheduleWindowResize() {
    // すでに次フレームの処理が予約されている場合は、同じ処理を重ねて予約しない。
    // 詳細: requestAnimationFrameの予約が存在する場合は、現在の呼び出しを終了する。
    if (resizeFrameId !== null) return;

    // 詳細: 次の描画フレームで実際の境界補正を実行する。
    resizeFrameId = window.requestAnimationFrame(() => {
        // 次回のresizeイベントを受け付けられるよう、実行中の予約状態を解除する。
        // 詳細: requestAnimationFrameの識別子を未予約状態へ戻す。
        resizeFrameId = null;
        // 詳細: 現在の表示領域に合わせて、全ウィジェットの表示位置を再計算する。
        handleWindowResize();
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// CSS座標を数値へ変換し、calc()や未設定値では実際の描画座標を使用する。
// 詳細: 関数「parseCoordinate」の処理ブロックを開始する。
function parseCoordinate(value, fallback) {
    // 詳細: CSS文字列から浮動小数点数への変換を試みる。
    const parsed = Number.parseFloat(value);
    // 詳細: 有効な数値なら変換結果を返し、変換できない場合は実測値を返す。
    return Number.isFinite(parsed) ? parsed : fallback;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 実測値を取得できない非表示要素でも、保存値やインライン値から寸法を復元する。
// 詳細: 関数「resolveWidgetDimension」の処理ブロックを開始する。
function resolveWidgetDimension(measuredValue, savedValue, inlineValue, fallbackValue) {
    // 詳細: 保存されたCSS寸法を数値へ変換する。
    const savedDimension = Number.parseFloat(savedValue);
    // 詳細: 現在のインラインCSS寸法を数値へ変換する。
    const inlineDimension = Number.parseFloat(inlineValue);

    // 詳細: 実測寸法が正の値なら、現在の表示状態を最優先して返す。
    if (measuredValue > 0) return measuredValue;
    // 詳細: 保存寸法が有効なら、非表示要素の補助寸法として返す。
    if (Number.isFinite(savedDimension) && savedDimension > 0) return savedDimension;
    // 詳細: インライン寸法が有効なら、現在設定されている寸法として返す。
    if (Number.isFinite(inlineDimension) && inlineDimension > 0) return inlineDimension;
    // 詳細: どの寸法も取得できない場合は、呼び出し元が指定した既定値を返す。
    return fallbackValue;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// 基準座標を変更せず、現在の画面で操作できる表示座標へ一時的に補正する。
// 詳細: 関数「constrainWidgetToVisibleArea」の処理ブロックを開始する。
function constrainWidgetToVisibleArea(el, container, baseState = null) {
    // 詳細: ウィジェットが画面固定配置かどうかを、ピン留めクラスから判定する。
    const isPinned = el.classList.contains('widget-pinned');
    // absolute配置の座標を画面座標へ変換するため、コンテナの表示位置を取得する。
    // 詳細: ダッシュボードの画面上の位置と寸法を取得する。
    const containerRect = container.getBoundingClientRect();
    // 詳細: 現在描画されているウィジェットの位置と寸法を取得する。
    const widgetRect = el.getBoundingClientRect();
    // fixed配置はビューポート、absolute配置はダッシュボードを水平方向の境界にする。
    // 詳細: ピン留め状態に応じて、ウィジェットを収める領域の幅を決定する。
    const boundaryWidth = isPinned
        // 詳細: fixed配置ではスクロールバーを除いたビューポート幅を使用する。
        ? (document.documentElement.clientWidth || window.innerWidth)
        // 詳細: absolute配置では配置基準となるダッシュボードの内側幅を使用する。
        : container.clientWidth;
    // 非表示要素の実測幅が0でも、保存値またはインライン値から境界判定できるようにする。
    // 詳細: ウィジェットの有効な幅を、実測値、保存値、インライン値、既定値の順で決定する。
    const widgetWidth = resolveWidgetDimension(
        // 詳細: 表示中のウィジェットから取得した実測幅を渡す。
        widgetRect.width,
        // 詳細: リサイズ前の基準状態に保存された幅を渡す。
        baseState?.width,
        // 詳細: 現在のインラインスタイルに設定された幅を渡す。
        el.style.width,
        // 詳細: 最終的な代替値として通常ウィジェット幅を渡す。
        WIDGET_WIDTH_NORMAL
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    );
    // fixed配置では画面座標、absolute配置ではコンテナ相対座標を実測フォールバックにする。
    // 詳細: 現在の描画位置から、配置方式に対応する左座標を計算する。
    const measuredLeft = isPinned ? widgetRect.left : widgetRect.left - containerRect.left;
    // 詳細: 現在の描画位置から、配置方式に対応する上座標を計算する。
    const measuredTop = isPinned ? widgetRect.top : widgetRect.top - containerRect.top;
    // リサイズ時は保存済み基準座標、ユーザー操作時は現在のインライン座標を補正元にする。
    // 詳細: 補正元として使用する左座標のCSS文字列を選択する。
    const sourceLeft = baseState?.left ?? el.style.left;
    // 詳細: 補正元として使用する上座標のCSS文字列を選択する。
    const sourceTop = baseState?.top ?? el.style.top;
    // 詳細: CSS左座標を数値化し、calc()や未設定値では実測座標へフォールバックする。
    const baseLeft = parseCoordinate(sourceLeft, measuredLeft);
    // 詳細: CSS上座標を数値化し、calc()や未設定値では実測座標へフォールバックする。
    const baseTop = parseCoordinate(sourceTop, measuredTop);
    // 詳細: ウィジェットの右端が境界を超えない最大左座標を計算する。
    const maxLeft = Math.max(0, boundaryWidth - widgetWidth);
    // 詳細: 左座標を0以上かつmaxLeft以下へ制限する。
    const displayLeft = Math.min(Math.max(baseLeft, 0), maxLeft);
    // fixed配置では画面下端も境界になるため、ウィジェット高を取得する。
    // 詳細: ウィジェットの有効な高さを、実測値、保存値、インライン値の順で決定する。
    const widgetHeight = resolveWidgetDimension(
        // 詳細: 表示中のウィジェットから取得した実測高を渡す。
        widgetRect.height,
        // 詳細: リサイズ前の基準状態に保存された高さを渡す。
        baseState?.height,
        // 詳細: 現在のインラインスタイルに設定された高さを渡す。
        el.style.height,
        // 詳細: 高さを取得できない場合は0として、上端だけを確実に補正する。
        0
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    );
    // absolute配置は縦スクロールできるため、下方向の上限を設けない。
    // 詳細: ピン留め状態に応じて、上座標の最大値を決定する。
    const maxTop = isPinned
        // 詳細: fixed配置ではウィジェット下端がビューポートを超えない最大上座標を計算する。
        ? Math.max(0, (document.documentElement.clientHeight || window.innerHeight) - widgetHeight)
        // 詳細: absolute配置では下方向への配置を許可するため、上限を無限大にする。
        : Number.POSITIVE_INFINITY;
    // 詳細: 上座標を0以上かつmaxTop以下へ制限する。
    const displayTop = Math.min(Math.max(baseTop, 0), maxTop);

    // 自動補正値は保存せず、現在の描画に使うインライン座標だけを更新する。
    // 詳細: 現在の表示領域へ収めた左座標を反映する。
    el.style.left = `${displayLeft}px`;
    // 詳細: 現在の表示領域へ収めた上座標を反映する。
    el.style.top = `${displayTop}px`;
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
            // 保存済み基準座標から表示位置を再計算し、自動補正値はlocalStorageへ書き戻さない。
            // 詳細: 通常配置とピン留め配置の両方を、現在の表示領域内へ一時的に収める。
            constrainWidgetToVisibleArea(el, container, state);
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
                // 初期配置も極端な画面比率では外れる可能性があるため、表示時だけ境界へ収める。
                // 詳細: 計算済みの初期位置を、現在の表示領域内へ制限する。
                constrainWidgetToVisibleArea(el, container, def);
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
