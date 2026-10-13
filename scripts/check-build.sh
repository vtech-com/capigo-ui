#!/bin/sh
# Fails when the committed public/r/ is not what `shadcn build` makes from the source.
set -eu
cd "$(dirname "$0")/.."
npm run --silent build
if ! git diff --exit-code -- public/r || [ -n "$(git status --porcelain -- public/r)" ]; then
  git status --short -- public/r
  echo "public/r/ is stale: run 'npm run build' and commit the result." >&2
  exit 1
fi
echo "public/r/ matches the source."
