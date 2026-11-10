#!/bin/sh
# Chrome Web Store 提出用の zip を dist/ に作る。
# 許可リスト方式：ここに書いたファイルだけを入れる。.env / .env.local / tests / docs は入らない。
set -eu

cd "$(dirname "$0")/.."

INCLUDE="manifest.json index.html spotify-setup.html Sortable.min.js js styles"

VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n 1)
OUT="dist/nexus-dash-${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"
# -X: macOS の拡張属性（__MACOSX/._*）を入れない
zip -r -X -q "$OUT" $INCLUDE -x '*.DS_Store' -x '.env*' -x '*/.env*'

# 念のため秘密情報が入っていないか確認する
if unzip -Z1 "$OUT" | grep -E '(^|/)\.env' >/dev/null; then
    echo "error: .env が zip に含まれています: $OUT" >&2
    rm -f "$OUT"
    exit 1
fi

echo "created $OUT ($(unzip -Z1 "$OUT" | wc -l | tr -d ' ') files)"
