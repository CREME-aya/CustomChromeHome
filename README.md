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

### 天気

- Open-Meteo API を使った現在天気、気温、降水確率の表示
- 市区町村検索による地点設定
- 直近 6 時間の降水確率グラフ

### ToDo

- 手入力のタスク追加
- 完了チェック
- タスク削除
- `localStorage` による自動保存

### Google カレンダー ToDo 化

- Google カレンダーの iCal URL から予定を取得
- 今後 3 / 7 / 14 / 30 日の範囲を選んで ToDo に変換
- Google カレンダー由来の ToDo にはラベルを表示
- カレンダー予定の `UID` を使って重複取り込みを防止

OAuth 連携ではなく iCal URL 方式です。Google カレンダーの設定画面から「iCal 形式の非公開 URL」または公開カレンダーの iCal URL を取得して使います。

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

### RSS / Discover

- 複数の RSS / Atom フィードの読み込み
- 記事検索
- お気に入り登録
- 記事プレビューのモーダル表示

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

## Spotify 連携の設定

Spotify 認証を使うには、Spotify Developer Dashboard の対象アプリで Redirect URI を登録する必要があります。

1. この拡張機能を Chrome に読み込む
2. 新しいタブを開き、DevTools の Console を開く
3. Spotify の「連携する」を押す
4. Console に出る `Spotify Redirect URI:` の値をコピーする
5. Spotify Developer Dashboard のアプリ設定で Redirect URI に同じ値を追加する

Redirect URI は完全一致が必要です。このアプリは `https://<拡張機能ID>.chromiumapp.org/spotify` の形式を使います。`/spotify` の有無、末尾スラッシュ、大文字小文字が違うと Spotify 側で `redirect_uri: Not matching configuration` になります。

Spotify 側へ登録後は、Chrome の拡張機能ページで Nexus Dash をリロードし、新しいタブを開き直してください。

## 設定と保存先

この拡張機能は主に `localStorage` に設定を保存します。

- RSS フィード URL
- 背景画像
- 表示ウィジェット設定
- ToDo
- Google カレンダー iCal URL
- AI API キー
- Spotify アクセストークン
- Spotify リフレッシュトークン
- クイックリンク

共有 PC で使う場合は、API キーや iCal URL の扱いに注意してください。

## 権限

`manifest.json` では以下の権限を使います。

- `identity`: Spotify 認証に使うため
- `tabs`: Spotify 認証ページを通常タブで開くフォールバックに使うため
- `host_permissions`: RSS、天気、カレンダー、AI、Spotify API へアクセスするため

## ファイル構成

```text
.
├── index.html     # 画面構造
├── style.css      # 見た目とレイアウト
├── script.js      # 各ウィジェットの処理
├── manifest.json  # Chrome 拡張設定
├── privacy.html   # Chrome Web Store 用プライバシーポリシー
└── README.md
```

## 開発メモ

ビルドは不要です。変更後は Chrome の拡張機能ページで対象拡張をリロードし、新しいタブを開き直してください。

構文確認:

```sh
node --check script.js
```

## 注意事項

- iCal URL は秘密情報に近い扱いです。公開リポジトリやスクリーンショットに載せないでください。
- AI API キーは外部サービスの課金につながるため、共有環境では保存しないでください。
- Spotify 認証を使うには、Spotify 側のアプリ設定とリダイレクト URL の整合が必要です。