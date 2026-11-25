#!/usr/bin/env bash
# Assemble the servable site OUTSIDE this repository, with a private config.
#
#   bash tools/stage_site.sh <dest-dir> <path-to-config.js>
#
# Why: js/config.js holds the Firebase web config. It must never sit inside the
# public repository's folder, so the site is assembled in a separate directory
# and served or deployed from there. The repository stays key-free.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${1:?usage: stage_site.sh <dest-dir> <config.js>}"
CONF="${2:?usage: stage_site.sh <dest-dir> <config.js>}"
case "$(cd "$(dirname "$DEST")" && pwd)/" in
  "$(pwd)/"*) echo "refusing: destination is inside the repository" >&2; exit 2 ;;
esac
[ -f "$CONF" ] || { echo "no config at $CONF" >&2; exit 2; }

# Gates first. A red gate stops here, whatever the deadline.
bash tools/gate_cycle.sh >/dev/null || { echo "GATES RED: not staging" >&2; exit 1; }

rm -rf "$DEST"
mkdir -p "$DEST/js" "$DEST/css"
cp index.html "$DEST/"
cp css/*.css "$DEST/css/"
cp js/app.js js/ai.js js/plain.js js/guard.js js/hold.js js/situations.js "$DEST/js/"
cp "$CONF" "$DEST/js/config.js"
cp firebase.json "$DEST/"
echo "staged $(find "$DEST" -type f | wc -l | tr -d ' ') files in $DEST"
