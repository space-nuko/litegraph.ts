#!/usr/bin/env sh

pushd packages/core
pnpm build
popd
mkdir -p out
cp packages/core/dist/litegraph-ts.es.js out/litegraph.core.js
echo "Wrote output to out/litegraph.core.js"

cp out/litegraph.core.js E:/ComfyUI/web/lib
