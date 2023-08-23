#!/usr/bin/env sh

pushd packages/core
pnpm build
popd
mkdir -p out
cp packages/core/dist/litegraph-ts.es.js out/litegraph.core.js
echo "Wrote output to out/litegraph.core.js"

pushd bundles/mini
pnpm build
popd
mkdir -p out
cp bundles/mini/dist/litegraph-ts.mini.es.js out/litegraph.mini.js

# cp out/litegraph.core.js E:/ComfyUI/web/lib
cp out/litegraph.mini.js E:/ComfyUI/web/lib/litegraph.core.js
