#!/usr/bin/env bash
# Every gate, in the order a failure is cheapest to understand.
# Nothing is committed unless this exits 0.
set -u
cd "$(dirname "$0")/.." || exit 2
PY=${PY:-python3}
fail=0
run () {
  printf '\n\033[1m== %s\033[0m\n' "$1"; shift
  if "$@"; then :; else fail=$((fail+1)); fi
}

# FIRST, ALWAYS. If this is red nothing else matters: the repo is public and
# the author's private work is not.
run "no private code" "$PY" tools/selftest_no_ecosystem_code.py

# SECOND. The code gate cannot see vocabulary, and vocabulary is how a family
# resemblance becomes evidence. The condition for this project is documents
# only, no private terms, no person scoring, enforced rather than remembered.
# Both gates read their lists from a private file outside the repo, so on any
# machine but the author's they are red by design.
run "gate selftest (it must fire on a plant before it may clear)" \
    "$PY" tools/gate_no_ecosystem_vocabulary.py --selftest
run "no private terms" "$PY" tools/gate_no_ecosystem_vocabulary.py

printf '\n'
if [ "$fail" -eq 0 ]; then printf '\033[32mALL GATES GREEN\033[0m\n'
else printf '\033[31m%d GATE(S) RED\033[0m\n' "$fail"; fi
exit "$fail"
