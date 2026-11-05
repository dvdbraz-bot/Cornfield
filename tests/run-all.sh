#!/bin/bash
# Runs every automated playthrough in headless Chrome (Playwright), shaped like
# an Android phone in landscape. Usage: bash tests/run-all.sh
# Each test prints what happened and ends with ERRORS [] (or errors []) when clean.
cd "$(dirname "$0")/.."
(curl -s -o /dev/null localhost:8123 || (python3 -m http.server 8123 >/dev/null 2>&1 &)); sleep 1
OUT=$(mktemp -d)
for t in prologue test-night touch-controls chapter-select day1-night1 day2 night2 day3-night3-interlude night3-chase day4-night4 day5-night5 day6-night6 day7-finale-endings; do
  echo "=== $t"
  mkdir -p "$OUT/$t"
  timeout 600 node "tests/$t.js" "$OUT/$t" 2>&1 | tail -25
done
echo "Screenshots are in $OUT"
