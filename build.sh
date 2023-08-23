#!/usr/bin/env sh

pushd packages/core
pnpm build
popd
mkdir -p out
cp packages/core/dist/litegraph-ts.es.js out/litegraph.core.js
echo "Wrote output to out/litegraph.core.js"

pushd bundles/full
pnpm build
popd
mkdir -p out
cp bundles/full/dist/litegraph-ts.full.es.js out/litegraph.full.js

# cp out/litegraph.core.js E:/ComfyUI/web/lib
cp out/litegraph.full.js E:/ComfyUI/web/lib/litegraph.core.js
