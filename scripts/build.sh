#!/usr/bin/env bash
# Genera dist/c3-email-rules-<version>.xpi con solo los archivos del add-on.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/c3-email-rules-${VERSION}.xpi"
rm -rf dist/stage && mkdir -p dist/stage
cp -r manifest.json background.js lib options icons LICENSE dist/stage/
rm -f "$OUT"
(cd dist/stage && zip -qr -X "../../$OUT" .)
echo "Generado $OUT"
