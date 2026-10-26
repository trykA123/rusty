#!/bin/sh
# Prints the largest change in average brightness between frames (0-255 scale) and every frame over the limit.
# usage: ./check-brightness.sh [video] [limit]
set -eu
video=${1:-navo-showreel.mp4}
limit=${2:-3}
ffmpeg -hide_banner -loglevel error -i "$video" -vf signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=- -f null - \
  | awk -v limit="$limit" -F= '/YAVG/ {
      y = ($2 - 16) * 255 / 219
      if (n > 0) { d = y - prev; if (d < 0) d = -d; if (d > max) { max = d; at = n } if (d > limit) { over++; printf "frame %d: %.2f\n", n, d } }
      prev = y; n++
    }
    END { printf "frames: %d, largest change: %.2f/255 at frame %d, over %s: %d\n", n, max, at, limit, over + 0 }'
