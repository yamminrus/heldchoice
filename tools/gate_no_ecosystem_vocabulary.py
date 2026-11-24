#!/usr/bin/env python3
"""The shipped page may not speak a private project's language.

    python3 tools/gate_no_ecosystem_vocabulary.py
    python3 tools/gate_no_ecosystem_vocabulary.py --selftest

WHY THIS EXISTS

The sibling gate catches copied CODE. It cannot catch a shipped page that uses
a private project's VOCABULARY, and vocabulary is how a family resemblance turns
into evidence. A reviewer reading this repo should find a generic tool about
documents, because that is what it is.

The condition for this project, in one line: **documents only, no private
terms, no person scoring.** Held as an intention it lasts until the first
late-night commit. Held as a gate it holds.

TWO GATES, in this order, because one is not enough:

  1. BANNED TERMS. A private project's own words, read from a private file
     outside every repository (default ~/.config/cleanroom/private.json, key
     "banned_terms", or the path in $CLEANROOM_PRIVATE). Publishing the list
     would publish what it protects. Without that file this gate is RED: a
     term gate with no terms passes everything, which is passing blind.

  2. PERSON SCORING. The hard line, and public on purpose. This tool grades
     DOCUMENTS. The moment a surface scores a person it is a different product
     in a different regulatory posture.

SCOPE, STATED: it reads the files a visitor or judge actually sees.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

#: Files a visitor or judge sees. Deliberately NOT every file: the planning
#: docs may discuss what is out of scope, and must be able to say the words.
SHIPPED_SUFFIXES = (".html", ".htm", ".js", ".mjs", ".ts", ".tsx", ".jsx",
                    ".css", ".json", ".svg", ".txt")

#: Never scanned: the gates, the hash record, and CONCEPT.md, a private
#: planning note that states what is excluded and never ships.
EXEMPT = {
    "tools/gate_no_ecosystem_vocabulary.py",
    "tools/selftest_no_ecosystem_code.py",
    "CONCEPT.md",
    "CLEANROOM.sha256",
    # The MIT copyright line must name the real legal entity to be a valid
    # licence. That is a legal attribution, not a product claim, and the
    # distinction is the whole reason this entry is listed rather than left to
    # the suffix filter: LICENSE has no extension, so it was escaping the scan
    # by accident. An exemption that happens by oversight is the kind that
    # widens later, so it is named here with its reason.
    "LICENSE",
}

#: Loaded, never written here. See the module docstring.
PRIVATE_FILE = pathlib.Path(os.environ.get(
    "CLEANROOM_PRIVATE",
    str(pathlib.Path.home() / ".config" / "cleanroom" / "private.json")))


def load_banned():
    """(patterns, error). Never raises; an empty list is reported, not used."""
    try:
        d = json.loads(PRIVATE_FILE.read_text())
        pats = list(d.get("banned_terms", []))
        for x in pats:
            re.compile(x)
        return pats, "" if pats else "banned_terms is empty"
    except Exception as exc:
        return [], "%s: %s" % (type(exc).__name__, exc)


BANNED, BANNED_ERR = load_banned()

#: Phrases that mean a PERSON is being graded. The hard line.
PERSON_SCORING = [
    r"\byour\s+(virtue|character|integrity|ethics)\s+(score|rating|grade|index)\b",
    r"\b(score|grade|rate|rank)\s+(a\s+)?(person|people|user|users|yourself|employee)",
    r"\b(user|player|employee|candidate)\s+(virtue|ethics|character)\b",
    r"\bmoral\s+(score|rating|grade)\b",
    r"\b(trustworthiness|honesty)\s+score\s+for\s+\w+",
]

_PERSON_RE = [(p, re.compile(p, re.I)) for p in PERSON_SCORING]


#: Visitor-facing attributes. An em dash in a code COMMENT is ordinary
#: engineering prose; an em dash in text a visitor reads is the house
#: no-AI-tells rule, and this repo goes public. Scoped to the attributes and
#: HTML text that actually reach a reader, deliberately NOT to comments, or the
#: gate would flag every well-written explanation in the source.
VISIBLE_ATTRS = re.compile(
    r'(?:placeholder|aria-label|title|alt|value)\s*=\s*"([^"]*)"', re.I)
DASHES = re.compile(r"[\u2014\u2013]")


def visible_dash_findings(root: pathlib.Path = ROOT) -> list:
    """Em or en dashes in text a visitor reads. Comments are exempt."""
    out = []
    for p, rel in shipped_files(root):
        try:
            text = p.read_text(errors="replace")
        except Exception:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            for m in VISIBLE_ATTRS.finditer(line):
                if DASHES.search(m.group(1)):
                    out.append((rel, i, "AI TELL (visible copy)",
                                m.group(1)[:60]))
        if rel.endswith((".html", ".htm")):
            # HTML text nodes, with comments and tags stripped first.
            body = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
            body = re.sub(r"<script.*?</script>", " ", body, flags=re.S | re.I)
            body = re.sub(r"<style.*?</style>", " ", body, flags=re.S | re.I)
            body = re.sub(r"<[^>]+>", " ", body)
            if DASHES.search(body):
                frag = DASHES.split(body)[0][-40:].strip()
                out.append((rel, 0, "AI TELL (page text)",
                            "...%s<dash>" % frag))
    return out


def shipped_files(root: pathlib.Path = ROOT):
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(root).as_posix()
        if rel in EXEMPT or rel.startswith((".git/", "node_modules/")):
            continue
        if p.suffix.lower() in SHIPPED_SUFFIXES or rel.endswith(".md"):
            yield p, rel


def scan(root: pathlib.Path = ROOT, banned=None) -> tuple[list, int]:
    banned_re = [(p, re.compile(p, re.I)) for p in (BANNED if banned is None else banned)]
    findings, n = [], 0
    for p, rel in shipped_files(root):
        try:
            text = p.read_text(errors="replace")
        except Exception as exc:
            # Unreadable is NOT clean. A file that cannot be scanned is
            # reported, because an empty read is how a gate passes blind.
            findings.append((rel, 0, "UNREADABLE", str(exc)[:60]))
            continue
        n += 1
        for i, line in enumerate(text.splitlines(), 1):
            for pat, rx in banned_re:
                m = rx.search(line)
                if m:
                    findings.append((rel, i, "PRIVATE TERM", m.group(0)))
            for pat, rx in _PERSON_RE:
                m = rx.search(line)
                if m:
                    findings.append((rel, i, "PERSON SCORING", m.group(0)))
    return findings, n


def selftest() -> bool:
    import tempfile
    ok = True

    def chk(name, cond):
        nonlocal ok
        print("  %-4s %s" % ("ok" if cond else "FAIL", name))
        if not cond:
            ok = False

    print("\n  no-private-terms gate selftest")
    print("  " + "-" * 60)
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td)
        (d / "tools").mkdir()

        # PLANTED, with stand-in terms: the selftest proves the mechanism
        # without naming anything real, so it can ship.
        fake = [r"\bzorblat\b", r"Q\s*[x×*]\s*R\s*=\s*S", r"\bVex\s*Hall\b"]
        (d / "index.html").write_text("<p>Your zorblat is 72.</p>")
        f, _ = scan(d, fake)
        chk("PLANTED a banned term is caught",
            any(k == "PRIVATE TERM" for _, _, k, _ in f))
        (d / "index.html").write_text("<p>Q x R = S, and vex   hall</p>")
        f, _ = scan(d, fake)
        chk("PLANTED spacing and case variants are caught",
            sum(k == "PRIVATE TERM" for _, _, k, _ in f) == 2)
        (d / "index.html").write_text("<p>We grade a person on honesty.</p>")
        f, _ = scan(d, fake)
        chk("PLANTED person scoring is caught",
            any(k == "PERSON SCORING" for _, _, k, _ in f))

        # CONTROL: ordinary words this project NEEDS must not fire, or the
        # gate bans its own subject matter and gets switched off.
        (d / "index.html").write_text(
            "<p>A claim arrives in costume. We check whether each statement "
            "carries an artifact: a number with a unit, a date, a link. "
            "Truth costs something. An absence is not a refusal. This grades "
            "documents, never people.</p>")
        f, _ = scan(d, fake)
        chk("CONTROL the project's OWN language passes (claim, artifact, "
            "absence, refusal, truth, cost)", f == [])

        # The gate must be able to see something at all.
        (d / "a.js").write_text("const x = 1;")
        f, n = scan(d)
        chk("CONTROL the gate can see files (it read %d)" % n, n >= 2)

        # Exempt files must be exempt, or the gate reds on its own word list.
        (d / "CONCEPT.md").write_text("Explicitly out: zorblat.")
        f, _ = scan(d, fake)
        chk("CONCEPT.md may NAME what it excludes without redding the gate",
            not any(rel == "CONCEPT.md" for rel, _, _, _ in f))

        # Unreadable must report, not pass.
        bad = d / "broken.js"
        bad.write_bytes(b"ok")
        bad.chmod(0o000)
        try:
            f, _ = scan(d)
            unreadable = any(k == "UNREADABLE" for _, _, k, _ in f)
        finally:
            bad.chmod(0o644)
        chk("an UNREADABLE shipped file is reported, not treated as clean",
            unreadable)

    print("\n  gate selftest %s\n" % ("GREEN" if ok else "RED"))
    return ok


def main() -> int:
    if "--selftest" in sys.argv:
        return 0 if selftest() else 1
    if BANNED_ERR:
        print("\n  NO-PRIVATE-TERMS GATE\n  " + "-" * 60)
        print("  RED - cannot read the private term list at %s (%s)." % (PRIVATE_FILE, BANNED_ERR))
        print("  A term gate with no terms passes everything. Expected red on any")
        print("  machine but the author's.")
        return 1
    findings, n = scan()
    findings += visible_dash_findings()
    print()
    print("  NO-PRIVATE-TERMS GATE")
    print("  " + "-" * 60)
    if not findings:
        print("  GREEN - %d shipped file(s) carry no private term and score "
              "no person." % n)
        print("  Scope: %s plus *.md, excluding %d exempt file(s)."
              % ("/".join(s.lstrip(".") for s in SHIPPED_SUFFIXES[:5]) + "/...",
                 len(EXEMPT)))
        return 0
    for rel, line, kind, hit in findings:
        print("  %-14s %s:%s  %r" % (kind, rel, line, hit))
    print()
    print("  RED - %d finding(s). The condition for this project is "
          "documents only," % len(findings))
    print("  no private terms, no person scoring. This is that condition, "
          "enforced.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
