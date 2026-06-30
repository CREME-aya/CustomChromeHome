# Nexus Dash

Chrome の新しいタブを、時計、天気、ToDo、カレンダー取り込み、AI チャット、Spotify、RSS フィードをまとめたダッシュボードに置き換える拡張機能です。

HTML / CSS / Vanilla JavaScript だけで構成しており、ビルド手順や外部ライブラリは不要です。

## 主な機能

### ダッシュボード

- 時計と日付の表示
- 背景画像のローカル画像設定
- Chrome 風のランダム背景
- ウィジェットごとの表示 / 非表示切り替え
- クイックリンクの追加と削除
- API接続状態の診断
- 予定・タスク統合ビュー

### 天気

- Open-Meteo API を使った現在天気、気温、降水確率の表示
- 市区町村検索による地点設定
- 直近 6 時間の降水確率グラフ

### ToDo

- 手入力のタスク追加
- 完了チェック
- タスク削除
- `localStorage` による自動保存

### 予定・タスク統合ビュー

- Google カレンダー、Google Tasks、ローカル ToDo を同じ時系列で表示
- 日時付きの予定・タスクを優先し、期限なしタスクも別枠で表示
- 既存ウィジェットのキャッシュを読むため、同期操作は各連携ウィジェット側で実行

### Google カレンダー ToDo 化

- Google カレンダーの iCal URL から予定を取得
- 今後 3 / 7 / 14 / 30 日の範囲を選んで ToDo に変換
- Google カレンダー由来の ToDo にはラベルを表示
- カレンダー予定の `UID` を使って重複取り込みを防止

OAuth 連携ではなく iCal URL 方式です。Google カレンダーの設定画面から「iCal 形式の非公開 URL」または公開カレンダーの iCal URL を取得して使います。

### Google OAuth 連携

- Chrome 拡張用 OAuth クライアント ID による Google 連携
- Google カレンダー予定の同期と予定追加
- Google Tasks のリスト取得、タスク追加、完了、削除
- Gmail 未読メールの簡易表示
- Calendar / Tasks / Gmail のスコープが不足している場合は、連携済み扱いにせず再連携を促す

利用には Google Cloud Console で Google Calendar API、Google Tasks API、Gmail API の有効化が必要です。OAuth 同意画面には Calendar / Tasks / Gmail のスコープを追加し、テスト公開中の場合は利用する Google アカウントをテストユーザーに追加してください。

### マルチ AI

- 1 つの入力から OpenAI / Anthropic / Gemini に同時送信
- 各 AI の回答をパネルで並列表示
- API キーはブラウザの `localStorage` に保存

### Spotify

- Chrome 拡張の `identity` API を使った Spotify 認証
- 再生中トラック、アーティスト、アートワークの表示
- 再生 / 一時停止、前へ、次への操作
- アクセストークン期限切れ時の自動更新
- `identity` API で認証ページを開けない場合の通常タブフォールバック

### 株価

- Alpha Vantage APIによる日足・現在値・前日比の表示
- 利用には設定サイドバーでAlpha Vantage APIキーの登録が必要
- 無料APIキーの利用上限を超えた場合は、キャッシュを表示してエラーを通知

### RSS / Discover

- 複数の RSS / Atom フィードの読み込み
- 記事検索
- お気に入り登録
- 記事プレビューのモーダル表示

### API 診断

- Google、GitHub、Alpha Vantage、Spotify、AI API、RSS、天気の設定状態を一覧表示
- 各ウィジェットの同期成功、失敗、キャッシュ表示、未設定を診断へ反映
- 診断ウィジェット自体は有料APIを自動実行せず、設定状態と直近の通信結果を表示

## セットアップ

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパー モード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. このディレクトリを選択する
5. 新しいタブを開く

ローカル HTML として `index.html` を直接開くこともできます。ただし Spotify 認証や一部の外部 API 取得は、Chrome 拡張として読み込んだ場合の動作を前提にしています。

## Chrome Web Store 掲載

Chrome Web Store に掲載する場合は、`privacy.html` を GitHub Pages などの公開 URL に配置し、その URL をプライバシーポリシー欄に入力してください。

例:

```text
https://<user-name>.github.io/<repository-name>/privacy.html
```

## Google カレンダーの使い方

1. Google カレンダーを開く
2. 対象カレンダーの設定を開く
3. 「iCal 形式の非公開 URL」または公開 URL をコピーする
4. Nexus Dash の設定サイドバーを開く
5. 「Googleカレンダー ToDo化」に URL を貼り付ける
6. 取り込み範囲を選ぶ
7. 「予定をToDo化」を押す

同じ予定を再度取り込んでも、既存の ToDo が重複して増えないようにしています。

## Google OAuth 連携の設定

Google カレンダー、Google Tasks、Gmail ウィジェットを使うには、Chrome 拡張用の OAuth クライアント ID が必要です。Web アプリケーション用クライアント ID ではなく、Chrome 拡張機能用クライアント ID を作成してください。

1. Google Cloud Console でプロジェクトを作成または選択する
2. 「APIとサービス」から Google Calendar API、Google Tasks API、Gmail API を有効化する
3. 「OAuth 同意画面」で Calendar / Tasks / Gmail のスコープを追加する
4. テスト公開中の場合は、利用する Google アカウントをテストユーザーへ追加する
5. 「認証情報」から OAuth クライアント ID を作成する
6. アプリケーションの種類に「Chrome 拡張機能」を選ぶ
7. 拡張機能 ID に `manifest.json` の `key` から固定される拡張機能 ID、または Chrome の拡張機能ページに表示される ID を登録する
8. 作成されたクライアント ID が `manifest.json` の `oauth2.client_id` と一致していることを確認する
9. Chrome の拡張機能ページで Nexus Dash をリロードする
10. Nexus Dash の設定サイドバーで「Googleと連携」を押し、Calendar / Tasks / Gmail の権限をすべて許可する

認証後に Calendar / Tasks / Gmail のいずれかへアクセスできない場合は、設定サイドバーで Google 連携を解除してから再連携してください。再連携時に一部の権限を拒否すると、対象 API は利用できません。

## Spotify 連携の設定

Spotify 認証を使うには、Spotify Developer Dashboard の対象アプリで Redirect URI を登録する必要があります。再生・一時停止・曲送り・曲戻しには Spotify Premium プランが必要です。

1. この拡張機能を Chrome に読み込む
2. 新しいタブの設定サイドバーを開く
3. 「Spotify 連携設定」の「URI と設定手順を別タブで開く」を押す
4. 表示された Redirect URI をコピーする
5. Spotify Developer Dashboard のアプリ設定で Redirect URI に同じ値を追加する
6. Nexus Dash の Spotify ウィジェットで「連携する」を押す

Redirect URI は完全一致が必要です。このアプリは `https://<拡張機能ID>.chromiumapp.org/spotify` の形式を使います。`/spotify` の有無、末尾スラッシュ、大文字小文字が違うと Spotify 側で `redirect_uri: Not matching configuration` になります。

認証に失敗した場合、直近のエラーは設定サイドバーと Spotify 連携設定ページに表示されます。Spotify 側へ登録後は、Chrome の拡張機能ページで Nexus Dash をリロードし、新しいタブを開き直してください。

## 設定と保存先

この拡張機能は主に `localStorage` に設定を保存します。AI API キーなどは、ローカル開発用の `.env` / `.env.local` からも読み込めます。Google OAuth の Client ID は Chrome 拡張の仕様に合わせ、`manifest.json` の `oauth2.client_id` に設定します。

`.env` を使う場合は、`.env.example` をコピーして必要な値だけ入力してください。`localStorage` に保存済みの値がある場合はそちらを優先し、未保存の項目だけ `.env` の値を使います。

```text
NEXUS_OPENAI_API_KEY=
NEXUS_ANTHROPIC_API_KEY=
NEXUS_GEMINI_API_KEY=
NEXUS_GOOGLE_CLIENT_ID=
NEXUS_GITHUB_PAT=
NEXUS_ALPHA_VANTAGE_API_KEY=
NEXUS_OPENAI_MODEL=gpt-4o
NEXUS_ANTHROPIC_MODEL=claude-sonnet-4-6
NEXUS_GEMINI_MODEL=gemini-3.5-flash
NEXUS_SPOTIFY_CLIENT_ID=3ed94377fd3840f2b3f3e88967a2ed78
```

`.env.local` は `.env` より後に読み込まれるため、端末ごとの上書きに使えます。どちらのファイルも Git 管理対象外です。

- RSS フィード URL
- 背景画像
- 表示ウィジェット設定
- ToDo
- Google カレンダー iCal URL
- Google Calendar / Tasks / Gmail の同期キャッシュ
- Google OAuth アクセストークン、取得済みスコープ
- AI API キー
- Alpha Vantage API キー
- GitHub PAT
- Spotify アクセストークン
- Spotify リフレッシュトークン
- クイックリンク
- API診断の直近ステータス

共有 PC で使う場合は、API キーや iCal URL の扱いに注意してください。

## 権限

`manifest.json` では以下の権限を使います。

- `identity`: Google / Spotify 認証に使うため
- `tabs`: 認証ページを通常タブで開くフォールバックに使うため
- `host_permissions`: RSS、天気、カレンダー、Google、AI、Spotify API へアクセスするため

## ファイル構成

```text
.
├── index.html        # 画面構造と script / stylesheet の読み込み順
├── manifest.json     # Chrome 拡張設定
├── privacy.html      # Chrome Web Store 用プライバシーポリシー
├── js/
│   ├── app.js        # DOMContentLoaded と初期化順序
│   ├── api-diagnostics.js # API接続状態の集約表示
│   ├── constants.js  # ストレージキー、定数、天気コード、背景プリセット
│   ├── storage.js    # localStorage helper
│   ├── feed.js       # RSS / Discover
│   ├── layout-defaults.js
│   ├── layout.js     # ウィジェット配置、ドラッグ、ピン留め
│   ├── calendar.js   # Google カレンダー ToDo 化
│   ├── unified-agenda.js # 予定・タスク統合ビュー
│   ├── ical-parser.js
│   ├── notifications.js
│   └── spotify/
│       ├── auth.js   # PKCE 認証とトークン管理
│       ├── api.js    # Spotify Web API 呼び出し
│       └── ui.js     # Spotify UI と polling
├── styles/
│   ├── variables.css
│   ├── base.css
│   ├── sidebar.css
│   ├── utilities.css
│   ├── layout-edit.css
│   ├── modal.css
│   ├── notifications.css
│   └── widgets/
└── tests/
    ├── ical-parser.test.html
    └── ical-parser.test.js
```

## 開発メモ

ビルドは不要です。変更後は Chrome の拡張機能ページで対象拡張をリロードし、新しいタブを開き直してください。

全 JavaScript の構文確認:

```sh
for file in js/*.js js/spotify/*.js tests/*.js; do node --check "$file" || exit 1; done
```

iCal parser のテスト:

```sh
node -e "const fs=require('fs'); const vm=require('vm'); global.window=globalThis; vm.runInThisContext(fs.readFileSync('js/ical-parser.js','utf8')); vm.runInThisContext(fs.readFileSync('tests/ical-parser.test.js','utf8')); const summary=window.runIcalParserTests(); console.log(JSON.stringify(summary)); if (!summary.passed) process.exit(1);"
```

## 注意事項

- iCal URL は秘密情報に近い扱いです。公開リポジトリやスクリーンショットに載せないでください。
- AI API キーは外部サービスの課金につながるため、共有環境では保存しないでください。
- Spotify 認証を使うには、Spotify 側のアプリ設定とリダイレクト URL の整合が必要です。
