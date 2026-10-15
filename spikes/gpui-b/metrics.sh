#!/usr/bin/env bash
set -euo pipefail

runs=5
out="metrics-out"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs) runs="${2:?--runs needs a number}"; shift 2 ;;
    --out) out="${2:?--out needs a directory}"; shift 2 ;;
    *) echo "usage: metrics.sh [--runs N] [--out DIR]" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")"
cargo build --release
bin="${CARGO_TARGET_DIR:-target}/release/gpui-b"
mkdir -p "$out"

for n in $(seq 1 "$runs"); do
  if [[ "$n" -eq 1 ]]; then
    kind=cold
    sync
  else
    kind=warm
  fi
  file="$out/metrics-$n.json"
  "$bin" --rows 100k --metrics "$file" 2>/dev/null
  jq -r --arg n "$n" --arg kind "$kind" \
    '"run \($n) \($kind): first_frame=\(.first_frame_ms)ms p95=\(.scroll.p95_ms)ms p99=\(.scroll.p99_ms)ms over16.7=\(.scroll.over_16_7_ms) rss=\(.memory.rss_bytes) exe=\(.binary_bytes)"' \
    "$file"
done
