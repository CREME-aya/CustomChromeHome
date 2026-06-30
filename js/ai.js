// ==========================================
// initApiKeys — APIキー管理
// ==========================================
// 詳細: 次の処理行「(function() {」の役割を、その場の制御フローに組み込む。
(function() {
const AI_MODELS = Object.freeze({
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-6',
    gemini: 'gemini-3.5-flash'
});

// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initApiKeys = initApiKeys;
// 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
window.initMultiAI = initMultiAI;

// 詳細: 関数「initApiKeys」の処理ブロックを開始する。
function initApiKeys() {
    // 詳細: 変数「keys」を、この後の処理で使う値として用意する。
    const keys = ['openai', 'anthropic', 'gemini'];
    // 詳細: 変数「apiKeys」を、この後の処理で使う値として用意する。
    const apiKeys = {};

    // 詳細: 関数「updateBoxStatus」の処理ブロックを開始する。
    function updateBoxStatus() {
        // APIキー保存後は、各チャット欄の初期メッセージを準備完了表示へ更新する。
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (apiKeys.openai) {
            // 詳細: 変数「b」を、この後の処理で使う値として用意する。
            const b = document.getElementById('chatbox-openai');
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">OpenAI APIキー設定済み<br><small style="color:#94a3b8;">接続状態は質問送信時に確認します</small></div>';
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (apiKeys.anthropic) {
            // 詳細: 変数「b」を、この後の処理で使う値として用意する。
            const b = document.getElementById('chatbox-anthropic');
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Anthropic APIキー設定済み<br><small style="color:#94a3b8;">接続状態は質問送信時に確認します</small></div>';
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (apiKeys.gemini) {
            // 詳細: 変数「b」を、この後の処理で使う値として用意する。
            const b = document.getElementById('chatbox-gemini');
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (b && b.innerHTML.includes('APIキーを設定してください')) b.innerHTML = '<div class="chat-msg ai-msg">Gemini APIキー設定済み<br><small style="color:#94a3b8;">接続状態は質問送信時に確認します</small></div>';
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 複数の要素を順番に処理するための反復処理を行う。
    keys.forEach(k => {
        // 入力欄と実行時参照用オブジェクトの両方に保存済みキーを復元する。
        // 詳細: 変数「input」を、この後の処理で使う値として用意する。
        const input = document.getElementById(`${k}-api-key`);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (input) {
            // 詳細: 変数「val」を、この後の処理で使う値として用意する。
            const val = localStorage.getItem(`custom_${k}_api_key`) || '';
            // 詳細: 次の処理行「input.value = val;」の役割を、その場の制御フローに組み込む。
            input.value = val;
            // 詳細: 次の処理行「apiKeys[k] = val;」の役割を、その場の制御フローに組み込む。
            apiKeys[k] = val;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
    });

    // 詳細: 次の処理行「updateBoxStatus();」の役割を、その場の制御フローに組み込む。
    updateBoxStatus();

    // 詳細: 変数「saveKeysBtn」を、この後の処理で使う値として用意する。
    const saveKeysBtn = document.getElementById('save-keys-btn');
    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (saveKeysBtn) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        saveKeysBtn.addEventListener('click', () => {
            // 詳細: 複数の要素を順番に処理するための反復処理を行う。
            keys.forEach(k => {
                // 詳細: 変数「input」を、この後の処理で使う値として用意する。
                const input = document.getElementById(`${k}-api-key`);
                // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
                if (input) {
                    // 詳細: 変数「val」を、この後の処理で使う値として用意する。
                    const val = input.value.trim();
                    // 詳細: ユーザー設定や状態を localStorage に保存する。
                    localStorage.setItem(`custom_${k}_api_key`, val);
                    // 詳細: 次の処理行「apiKeys[k] = val;」の役割を、その場の制御フローに組み込む。
                    apiKeys[k] = val;
                // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
                }
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });
            // 詳細: 次の処理行「updateBoxStatus();」の役割を、その場の制御フローに組み込む。
            updateBoxStatus();
            // 詳細: 次の処理行「window.showNotification('APIキーを保存しました', 'success');」の役割を、その場の制御フローに組み込む。
            window.showNotification('APIキーを保存しました', 'success');
            window.ApiDiagnostics?.refresh?.();
            // 詳細: 次の処理行「window._toggleSidebar?.();」の役割を、その場の制御フローに組み込む。
            window._toggleSidebar?.();
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // apiKeysオブジェクトをマルチAI機能から参照するために公開
    // 詳細: 他モジュールから利用できるように、処理や値を window に公開する。
    window._apiKeys = apiKeys;
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}

// ==========================================
// initMultiAI — AIチャット送信機能
// ==========================================
// 詳細: 関数「initMultiAI」の処理ブロックを開始する。
function initMultiAI() {
    // 詳細: 変数「aiGlobalInput」を、この後の処理で使う値として用意する。
    const aiGlobalInput = document.getElementById('ai-global-input');
    // 詳細: 変数「aiGlobalSendBtn」を、この後の処理で使う値として用意する。
    const aiGlobalSendBtn = document.getElementById('ai-global-send-btn');

    // 詳細: 関数「formatMarkdown」の処理ブロックを開始する。
    function formatMarkdown(text) {
        // API応答を先にエスケープし、許可した最小限の装飾だけをHTMLへ戻す。
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return String(text)
                   .replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;')
                   .replace(/\n/g, '<br>')
                   // 詳細: 次の処理行「.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');」の役割を、その場の制御フローに組み込む。
                   .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「addChatMessageToBox」の処理ブロックを開始する。
    function addChatMessageToBox(boxId, text, sender) {
        // 詳細: 変数「box」を、この後の処理で使う値として用意する。
        const box = document.getElementById(boxId);
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!box) return;

        // APIキー催促メッセージなどをクリア
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (box.innerHTML.includes('APIキーを設定してください')) {
            // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
            box.innerHTML = '';
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 変数「msgDiv」を、この後の処理で使う値として用意する。
        const msgDiv = document.createElement('div');
        // 詳細: 次の処理行「msgDiv.className = バッククォートchat-msg ${sender}-msgバッククォート;」の役割を、その場の制御フローに組み込む。
        msgDiv.className = `chat-msg ${sender}-msg`;
        // 詳細: HTMLとして描画する内容を組み立てて、対象要素へ反映する。
        msgDiv.innerHTML = formatMarkdown(text);
        // 詳細: 作成済みのDOM要素を親要素へ追加し、画面に表示する。
        box.appendChild(msgDiv);
        // 詳細: 次の処理行「box.scrollTop = box.scrollHeight;」の役割を、その場の制御フローに組み込む。
        box.scrollTop = box.scrollHeight;
        // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
        return msgDiv;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「fetchOpenAI」の処理ブロックを開始する。
    async function fetchOpenAI(prompt, boxId) {
        // 詳細: 変数「apiKeys」を、この後の処理で使う値として用意する。
        const apiKeys = window._apiKeys;
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!apiKeys.openai) {
            // 詳細: 次の処理行「addChatMessageToBox(boxId, 'エラー: OpenAI APIキーが未設定です。', 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, 'エラー: OpenAI APIキーが未設定です。', 'ai');
            window.ApiDiagnostics?.report('openai', 'missing', 'OpenAI APIキー未設定');
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // 詳細: 変数「loadingDiv」を、この後の処理で使う値として用意する。
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // ブラウザから直接呼び出すため、ユーザー保存のAPIキーをAuthorizationに使う。
            // 詳細: 変数「res」を、この後の処理で使う値として用意する。
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                // 詳細: オブジェクトのプロパティ値を定義する。
                method: 'POST',
                // 詳細: 次の処理行「headers: {」の役割を、その場の制御フローに組み込む。
                headers: {
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'Authorization': `Bearer ${apiKeys.openai}`,
                    // 詳細: 次の処理行「'Content-Type': 'application/json'」の役割を、その場の制御フローに組み込む。
                    'Content-Type': 'application/json'
                // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
                },
                // 詳細: JavaScriptの値を保存可能なJSON文字列へ変換する。
                body: JSON.stringify({
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    model: AI_MODELS.openai,
                    // 詳細: 次の処理行「messages: [{ role: 'user', content: prompt }]」の役割を、その場の制御フローに組み込む。
                    messages: [{ role: 'user', content: prompt }]
                // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
                })
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });
            // 詳細: 変数「data」を、この後の処理で使う値として用意する。
            const data = await res.json();
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            // 詳細: 次の処理行「addChatMessageToBox(boxId, data.choices[0].message.content, 'ai');」の役割を、その場の制御フローに組み込む。
            const responseText = data.choices?.[0]?.message?.content;
            if (!responseText) throw new Error('OpenAI APIから回答本文が返されませんでした。');
            addChatMessageToBox(boxId, responseText, 'ai');
            window.ApiDiagnostics?.report('openai', 'ok', 'OpenAI API 応答成功');
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (e) {
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 次の処理行「addChatMessageToBox(boxId, バッククォートエラー: ${e.message}バッククォート, 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
            window.ApiDiagnostics?.report('openai', 'error', `OpenAI API エラー: ${e.message}`);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「fetchAnthropic」の処理ブロックを開始する。
    async function fetchAnthropic(prompt, boxId) {
        // 詳細: 変数「apiKeys」を、この後の処理で使う値として用意する。
        const apiKeys = window._apiKeys;
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!apiKeys.anthropic) {
            // 詳細: 次の処理行「addChatMessageToBox(boxId, 'エラー: Anthropic APIキーが未設定です。', 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, 'エラー: Anthropic APIキーが未設定です。', 'ai');
            window.ApiDiagnostics?.report('anthropic', 'missing', 'Anthropic APIキー未設定');
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // 詳細: 変数「loadingDiv」を、この後の処理で使う値として用意する。
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // Anthropicのブラウザ直呼び出しに必要なヘッダーを明示する。
            // 詳細: 変数「res」を、この後の処理で使う値として用意する。
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                // 詳細: オブジェクトのプロパティ値を定義する。
                method: 'POST',
                // 詳細: 次の処理行「headers: {」の役割を、その場の制御フローに組み込む。
                headers: {
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'x-api-key': apiKeys.anthropic,
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'anthropic-version': '2023-06-01',
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    'content-type': 'application/json',
                    // 詳細: 次の処理行「'anthropic-dangerously-allow-browser': 'true'」の役割を、その場の制御フローに組み込む。
                    'anthropic-dangerously-allow-browser': 'true'
                // 詳細: 現在のオブジェクト要素または配列要素の定義を閉じる。
                },
                // 詳細: JavaScriptの値を保存可能なJSON文字列へ変換する。
                body: JSON.stringify({
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    model: AI_MODELS.anthropic,
                    // 詳細: オブジェクトのプロパティ値を定義する。
                    max_tokens: 1024,
                    // 詳細: 次の処理行「messages: [{ role: 'user', content: prompt }]」の役割を、その場の制御フローに組み込む。
                    messages: [{ role: 'user', content: prompt }]
                // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
                })
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });
            // 詳細: 変数「data」を、この後の処理で使う値として用意する。
            const data = await res.json();
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            // 詳細: 次の処理行「addChatMessageToBox(boxId, data.content[0].text, 'ai');」の役割を、その場の制御フローに組み込む。
            const responseText = data.content?.find(part => part.type === 'text')?.text;
            if (!responseText) throw new Error('Anthropic APIから回答本文が返されませんでした。');
            addChatMessageToBox(boxId, responseText, 'ai');
            window.ApiDiagnostics?.report('anthropic', 'ok', 'Anthropic API 応答成功');
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (e) {
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 次の処理行「addChatMessageToBox(boxId, バッククォートエラー: ${e.message}バッククォート, 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
            window.ApiDiagnostics?.report('anthropic', 'error', `Anthropic API エラー: ${e.message}`);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 関数「fetchGemini」の処理ブロックを開始する。
    async function fetchGemini(prompt, boxId) {
        // 詳細: 変数「apiKeys」を、この後の処理で使う値として用意する。
        const apiKeys = window._apiKeys;
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!apiKeys.gemini) {
            // 詳細: 次の処理行「addChatMessageToBox(boxId, 'エラー: Gemini APIキーが未設定です。', 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, 'エラー: Gemini APIキーが未設定です。', 'ai');
            window.ApiDiagnostics?.report('gemini', 'missing', 'Gemini APIキー未設定');
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
        // 詳細: 変数「loadingDiv」を、この後の処理で使う値として用意する。
        const loadingDiv = addChatMessageToBox(boxId, '考え中...', 'ai');
        // 詳細: 失敗する可能性がある処理を、例外捕捉できる範囲で開始する。
        try {
            // GeminiはAPIキーをクエリパラメータで渡す仕様に合わせる。
            // 詳細: 変数「res」を、この後の処理で使う値として用意する。
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.gemini}:generateContent?key=${apiKeys.gemini}`, {
                // 詳細: オブジェクトのプロパティ値を定義する。
                method: 'POST',
                // 詳細: オブジェクトのプロパティ値を定義する。
                headers: { 'Content-Type': 'application/json' },
                // 詳細: JavaScriptの値を保存可能なJSON文字列へ変換する。
                body: JSON.stringify({
                    // 詳細: 次の処理行「contents: [{ parts: [{ text: prompt }] }]」の役割を、その場の制御フローに組み込む。
                    contents: [{ parts: [{ text: prompt }] }]
                // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
                })
            // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
            });
            // 詳細: 変数「data」を、この後の処理で使う値として用意する。
            const data = await res.json();
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (!res.ok) throw new Error(data.error?.message || 'API Error');
            // 詳細: 次の処理行「addChatMessageToBox(boxId, data.candidates[0].content.parts[0].text, 'ai');」の役割を、その場の制御フローに組み込む。
            const responseText = data.candidates?.[0]?.content?.parts
                ?.filter(part => typeof part.text === 'string')
                .map(part => part.text)
                .join('');
            if (!responseText) throw new Error('Gemini APIから回答本文が返されませんでした。');
            addChatMessageToBox(boxId, responseText, 'ai');
            window.ApiDiagnostics?.report('gemini', 'ok', 'Gemini API 応答成功');
        // 詳細: オブジェクトまたはブロックの境界を定義する。
        } catch (e) {
            // 詳細: 不要になったDOM要素を画面から取り除く。
            loadingDiv.remove();
            // 詳細: 次の処理行「addChatMessageToBox(boxId, バッククォートエラー: ${e.message}バッククォート, 'ai');」の役割を、その場の制御フローに組み込む。
            addChatMessageToBox(boxId, `エラー: ${e.message}`, 'ai');
            window.ApiDiagnostics?.report('gemini', 'error', `Gemini API エラー: ${e.message}`);
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 外部から呼び出せる関数「sendToAI」を定義する。
    window.sendToAI = async function(prompt) {
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!prompt) return;

        // 非表示のAIパネルには送信せず、画面上で比較できるモデルだけに投げる。
        // 詳細: 変数「isOpenAIVisible」を、この後の処理で使う値として用意する。
        const isOpenAIVisible = document.getElementById('toggle-ai-openai')?.checked;
        // 詳細: 変数「isAnthropicVisible」を、この後の処理で使う値として用意する。
        const isAnthropicVisible = document.getElementById('toggle-ai-anthropic')?.checked;
        // 詳細: 変数「isGeminiVisible」を、この後の処理で使う値として用意する。
        const isGeminiVisible = document.getElementById('toggle-ai-gemini')?.checked;

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (!isOpenAIVisible && !isAnthropicVisible && !isGeminiVisible) {
            // 詳細: 次の処理行「window.showNotification('表示されているAIモデルがありません。設定から表示をONにしてください。', 'error');」の役割を、その場の制御フローに組み込む。
            window.showNotification('表示されているAIモデルがありません。設定から表示をONにしてください。', 'error');
            // 詳細: 呼び出し元へ処理結果を返して、この関数の流れを終える。
            return;
        // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
        }

        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isOpenAIVisible) addChatMessageToBox('chatbox-openai', prompt, 'user');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isAnthropicVisible) addChatMessageToBox('chatbox-anthropic', prompt, 'user');
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isGeminiVisible) addChatMessageToBox('chatbox-gemini', prompt, 'user');

        // 詳細: 次の処理行「aiGlobalInput.value = '';」の役割を、その場の制御フローに組み込む。
        aiGlobalInput.value = '';
        // 詳細: 次の処理行「aiGlobalSendBtn.disabled = true;」の役割を、その場の制御フローに組み込む。
        aiGlobalSendBtn.disabled = true;

        // 複数モデルの応答を待ち合わせ、全完了後に送信ボタンを戻す。
        // 詳細: 変数「promises」を、この後の処理で使う値として用意する。
        const promises = [];
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isOpenAIVisible) promises.push(fetchOpenAI(prompt, 'chatbox-openai'));
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isAnthropicVisible) promises.push(fetchAnthropic(prompt, 'chatbox-anthropic'));
        // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
        if (isGeminiVisible) promises.push(fetchGemini(prompt, 'chatbox-gemini'));

        // 詳細: 非同期処理の完了を待ってから、次の処理へ進める。
        await Promise.all(promises);
        // 詳細: 次の処理行「aiGlobalSendBtn.disabled = false;」の役割を、その場の制御フローに組み込む。
        aiGlobalSendBtn.disabled = false;
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    };

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (aiGlobalSendBtn) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        aiGlobalSendBtn.addEventListener('click', () => {
            // 詳細: 次の処理行「window.sendToAI(aiGlobalInput.value.trim());」の役割を、その場の制御フローに組み込む。
            window.sendToAI(aiGlobalInput.value.trim());
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }

    // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
    if (aiGlobalInput) {
        // 詳細: 対象要素のイベントを監視し、ユーザー操作に応じた処理を登録する。
        aiGlobalInput.addEventListener('keypress', (e) => {
            // 詳細: 条件を確認し、必要な場合だけ内側の処理へ進む。
            if (e.key === 'Enter') {
                // 詳細: 次の処理行「window.sendToAI(aiGlobalInput.value.trim());」の役割を、その場の制御フローに組み込む。
                window.sendToAI(aiGlobalInput.value.trim());
            // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
            }
        // 詳細: 現在の関数呼び出しまたは即時実行関数のブロックを閉じる。
        });
    // 詳細: 現在のオブジェクト定義または関数代入を閉じる。
    }
// 詳細: 現在のオブジェクト定義または関数代入を閉じる。
}
// 詳細: オブジェクトまたはブロックの境界を定義する。
})();
