# Nexus Dash

Chrome の新しいタブを、時計、天気、ToDo、カレンダー取り込み、AI チャット、Spotify、RSS フィード、GitHub 連携をまとめたダッシュボードに置き換える拡張機能です。

HTML / CSS / Vanilla JavaScript だけで構成しており、ビルド手順や外部ライブラリは不要です。

> **位置づけ**：作者が自分で毎日使うための個人ツールです。Chrome Web Store での一般向け展開は行っていません。
> ソースは MIT ライセンスで公開しているので、自由にフォークして自分用に改造してください。Issue や PR への対応は保証しません。

## 主な機能

### ダッシュボード

- 時計と日付の表示
- 背景画像のローカル画像設定
- Chrome 風 of ランダム背景
- ウィジェットごとの表示 / 非表示切り替え
- ウィジェットの自由な配置（ドラッグ）およびリサイズ（右下ハンドルドラッグ）
- クイックリンクの追加と削除
- API接続状態の診断
- 予定・タスク統合ビュー
- 画面サイズ変更時や表示切替時における位置の自動補正（境界クランプ）および元の配置の復元

### 天気

- Open-Meteo API（気象庁モデル）を使った現在天気、気温、降水量の表示
- 市区町村検索による地点設定
- 直近 6 時間の1時間降水量グラフ (mm)

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

- Google Sheets の `GOOGLEFINANCE` 関数で計算した現在値・前日比の表示
- 利用には公開CSVとして取得できる Google Sheets URL の登録が必要
- 取得に失敗した場合は、キャッシュを表示してエラーを通知

### RSS / Discover

- 複数の RSS / Atom フィードの読み込みと表示モード（混合表示 / フィード別表示）の切り替え
- 「混合表示」：全フィードの記事を公開日時の新しい順にソートして一括表示。トラッキングパラメータ除去を含む重複排除、出典（フィード名）の表示
- 「フィード別表示」：設定した順でフィードごとにグループ分けして表示。一部フィードの取得失敗時も他の成功フィードの表示を妨げない部分失敗表示
- 記事検索およびお気に入り登録（`localStorage` に保存）
- 記事プレビューのモーダル表示と、元記事の別タブ表示
- プレビュー HTML のサニタイズ（`script` やイベント属性、危険な URL スキームの除去）による安全な表示
- タイムアウト（1フィードあたり10秒）および同時接続数制限（最大4件）による負荷軽減と安定動作
- stale cache（キャッシュ）機能：オフラインや API 障害時でも直近のキャッシュ（最大24時間）を表示可能

### GitHub 連携

- GitHub PAT (個人アクセストークン) を使用して、自分にアサインされたオープン状態の Issue および PR を最大10件取得・表示
- 同期動作のキャッシュ化と、同期失敗時のキャッシュ自動表示

### GitHub Contribution Grass（芝生）

- GitHub GraphQL API を用いて、ユーザーの年間コントリビューション（芝生）をダッシュボード上にグリッド表示
- ダークモードとライトテーマに適応するカラー表示（`getAdaptiveColor`）

### API 診断

- Google、GitHub、GoogleFinance、Spotify、AI API、RSS、天気の設定状態を一覧表示
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

Chrome Web Store に掲載する場合は、`docs/privacy.html` を GitHub Pages などの公開 URL に配置し、その URL をプライバシーポリシー欄に入力してください。

例:

```text
https://<user-name>.github.io/<repository-name>/docs/privacy.html
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

## 株価ウィジェットの使い方

株価はブラウザから `GOOGLEFINANCE` 関数を直接実行するのではなく、Google Sheets で計算した結果を公開CSVとして読み込みます。

1. Google Sheets に株価用のシートを作成する
2. 1行目に `symbol`, `name`, `price`, `change`, `changepct`, `currency`, `updatedAt`, `prices` を置く
3. 2行目以降に銘柄と `GOOGLEFINANCE` の式を入れる
4. 「ファイル」から「共有」または「ウェブに公開」を設定し、CSVとして読める URL を用意する
5. Nexus Dash の設定サイドバーで Google Sheets CSV URL を保存する
6. 表示したい銘柄を `NASDAQ:AAPL` や `TYO:7203` の形式で登録する

式の例:

```text
A2: NASDAQ:AAPL
B2: Apple
C2: =GOOGLEFINANCE(A2, "price")
D2: =GOOGLEFINANCE(A2, "change")
E2: =GOOGLEFINANCE(A2, "changepct")
F2: =GOOGLEFINANCE(A2, "currency")
G2: =GOOGLEFINANCE(A2, "tradetime")
H2: 190;192;191;195
```

`prices` 列はスパークライン用の任意列です。省略した場合は現在値だけで平坦な線を表示します。

## Google OAuth 連携の設定

Google カレンダー、Google Tasks、Gmail ウィジェットを使うには、Web アプリケーション用の OAuth クライアント ID が必要です。この拡張機能は `chrome.identity.launchWebAuthFlow` で Google の認証画面を開き、Chrome 拡張のリダイレクト URI へ戻ってきたアクセストークンを使います。

1. Google Cloud Console でプロジェクトを作成または選択する
2. 「APIとサービス」から Google Calendar API、Google Tasks API、Gmail API を有効化する
3. 「OAuth 同意画面」で Calendar / Tasks / Gmail のスコープを追加する
4. テスト公開中の場合は、利用する Google アカウントをテストユーザーへ追加する
5. 「認証情報」から OAuth クライアント ID を作成する
6. アプリケーションの種類に「Web アプリケーション」を選ぶ
7. 「承認済みのリダイレクト URI」に `https://<拡張機能ID>.chromiumapp.org/` を登録する
8. 作成されたクライアント ID が `manifest.json` の `oauth2.client_id` と一致していることを確認する
9. Chrome の拡張機能ページで Nexus Dash をリロードする
10. Nexus Dash の設定サイドバーで「Googleと連携」を押し、Calendar / Tasks / Gmail の権限をすべて許可する

認証後に Calendar / Tasks / Gmail のいずれかへアクセスできない場合は、設定サイドバーで Google 連携を解除してから再連携してください。再連携時に一部の権限を拒否すると、対象 API は利用できません。

## GitHub 連携および芝生ウィジェットの設定

GitHub Issues/PR およびコントリビューション芝生を表示するには、GitHub の個人アクセストークン（Personal Access Token: PAT）が必要です。

1. GitHub の「Settings」 > 「Developer settings」 > 「Personal Access Tokens」 > 「Tokens (classic)」を開く
2. 「Generate new token (classic)」を押す
3. 必要なスコープを選択する：
   - 芝生の取得とアサインされた Issue/PR 取得のために `repo` または `read:user` を付与する
4. 生成されたトークンをコピーする
5. Nexus Dash の設定サイドバーを開く
6. 「GitHub 連携設定」に PAT を貼り付け、「保存」を押す
7. 芝生およびアサイン済み Issue/PR リストが表示されることを確認する

トークンをクリアしたい場合は、設定サイドバーの入力欄を空にして「保存」を押すと設定が解除されます。

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
NEXUS_GOOGLEFINANCE_CSV_URL=
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
- GoogleFinance CSV URL
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
- `scripting`: 認証や処理に必要な一部のスクリプト実行などに使用するため
- `host_permissions`: `<all_urls>` を指定し（任意の iCal URL を取得するため絞り込めない）、RSS、天気、カレンダー、Google、AI、Spotify API 等へアクセスするため

## ファイル構成

```text
.
├── index.html        # 画面構造と script / stylesheet の読み込み順
├── manifest.json     # Chrome 拡張設定
├── docs/
│   ├── privacy.html  # Chrome Web Store 用プライバシーポリシー
│   └── 要件.md       # 機能・非機能要件
├── js/
│   ├── ai/           # AI チャットウィジェット
│   │   ├── constants.js
│   │   ├── providers.js # OpenAI / Anthropic / Gemini API 呼び出し
│   │   ├── settings.js
│   │   └── widget.js
│   ├── core/
│   │   └── base-widget.js # ウィジェットの共通ベースクラス
│   ├── feed/         # RSS / Discover
│   │   ├── constants.js
│   │   ├── data.js   # フィード取得・キャッシュ・並行制御
│   │   ├── parser.js # XML/JSON パースとサニタイズ
│   │   ├── renderer.js
│   │   └── search.js # 検索・フィルタ
│   ├── layout/       # レイアウト管理
│   │   ├── drag.js   # ドラッグ＆ドロップ、リサイズ
│   │   └── widget.js # 状態保存・復元・リサイズ時クランプ
│   ├── spotify/      # Spotify
│   │   ├── auth.js   # PKCE 認証とトークン管理
│   │   ├── api.js    # Spotify Web API 呼び出し
│   │   └── ui.js     # Spotify UI と polling
│   ├── weather/      # 天気
│   │   ├── constants.js
│   │   ├── data.js   # API 通信・位置情報管理
│   │   └── widget.js
│   ├── google/       # Google OAuth / Calendar / Tasks / Gmail
│   │   ├── auth.js
│   │   ├── calendar.js
│   │   ├── tasks.js
│   │   └── gmail.js
│   ├── github/       # GitHub Issues / PR / Contribution Grass
│   │   ├── issues.js
│   │   └── grass.js
│   ├── app.js        # DOMContentLoaded と初期化順序
│   ├── api-diagnostics.js # API接続状態の集約表示
│   ├── api-ui.js     # ローディング/エラー共通UI
│   ├── background.js # 背景画像管理
│   ├── calendar.js   # Google カレンダー ToDo 化
│   ├── clock.js      # 時計
│   ├── constants.js  # ストレージキー、定数、背景プリセット等
│   ├── env-config.js # .env 設定値管理
│   ├── ical-parser.js # iCal パーサー
│   ├── input-fix.js  # テキスト入力のフォーカス修正
│   ├── layout-defaults.js # 初期配置計算
│   ├── media-controller.js # Spotify/YouTube 切替制御
│   ├── notifications.js # 通知トースト
│   ├── quick-links.js # クイックリンク
│   ├── sidebar.js    # 設定サイドバー
│   ├── stocks.js     # 株価ウィジェット
│   ├── storage.js    # localStorage helper
│   ├── theme.js      # UIテーマ切替
│   ├── todo.js       # ToDo
│   ├── unified-agenda.js # 予定・タスク統合ビュー
│   └── widget-toggles.js # ウィジェット表示/非表示トグル
├── styles/
│   ├── variables.css # CSS 変数とテーマ定義
│   ├── base.css      # 基本レイアウトと共通スタイル
│   ├── sidebar.css   # サイドバー用
│   ├── utilities.css # ユーティリティ
│   ├── layout-edit.css # 編集モード
│   ├── modal.css     # モーダル
│   ├── notifications.css # トースト
│   ├── spotify-setup.css # Spotify 設定ガイド用
│   └── widgets/      # 各ウィジェット個別 CSS
│       ├── ai.css, clock.css, discover.css, github.css, github-grass.css,
│       ├── gmail.css, google-calendar.css, google-tasks.css,
│       ├── quick-links.css, spotify.css, stocks.css, todo.css,
│       └── unified-agenda.css, weather.css, api-diagnostics.css
└── tests/            # テストコード
    ├── env-config.test.js
    ├── feed-core.test.js
    ├── ical-parser.test.js
    ├── ical-parser.test.html
    ├── static-contracts.test.js
    ├── stocks-core.test.js
    ├── unified-agenda.test.js
    └── weather-core.test.js
```

## 開発メモ

ビルドは不要です。変更後は Chrome の拡張機能ページで対象拡張をリロードし、新しいタブを開き直してください。

全テストの実行:

```sh
node tests/run-all.js
```

全 JavaScript の構文確認:

```sh
for file in js/*.js js/*/*.js tests/*.js; do node --check "$file" || exit 1; done
```

iCal parser のテスト:

```sh
node -e "const fs=require('fs'); const vm=require('vm'); global.window=globalThis; vm.runInThisContext(fs.readFileSync('js/ical-parser.js','utf8')); vm.runInThisContext(fs.readFileSync('tests/ical-parser.test.js','utf8')); const summary=window.runIcalParserTests(); console.log(JSON.stringify(summary)); if (!summary.passed) process.exit(1);"
```

## 注意事項

- iCal URL は秘密情報に近い扱いです。公開リポジトリやスクリーンショットに載せないでください。
- AI API キーは外部サービスの課金につながるため、共有環境では保存しないでください。
- Spotify 認証を使うには、Spotify 側のアプリ設定とリダイレクト URL の整合が必要です。

## ライセンス

[MIT](LICENSE)
