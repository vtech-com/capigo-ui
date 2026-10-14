#!/bin/sh
# Installs every built item into a fresh shadcn Vite app, the way a consumer would, then
# typechecks and builds that app with each item's demo. Needs network: init and add pull from
# npm and ui.shadcn.com.
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp:?}"' EXIT
app="$tmp/smoke-app"
shadcn="$root/node_modules/.bin/shadcn"

"$shadcn" init --template vite --base radix --preset nova --name smoke-app --cwd "$tmp" --no-monorepo --yes
"$shadcn" add "$root/public/r/status-split-pill.json" "$root/public/r/progress-circle.json" --cwd "$app" --yes

cp "$root/src/status-split-pill/status-split-pill-demo.tsx" "$app/src/components/status-split-pill-demo.tsx"
cp "$root/src/progress-circle/progress-circle-demo.tsx" "$app/src/components/progress-circle-demo.tsx"
cat > "$app/src/App.tsx" <<'TSX'
import { ProgressCircleDemo } from "@/components/progress-circle-demo"
import { StatusSplitPillDemo } from "@/components/status-split-pill-demo"

export default function App() {
  return (
    <>
      <StatusSplitPillDemo />
      <ProgressCircleDemo />
    </>
  )
}
TSX

cd "$app"
npx tsc -p tsconfig.app.json --noEmit
npm run build
echo "smoke: status-split-pill and progress-circle install, typecheck and build in a fresh shadcn app."
