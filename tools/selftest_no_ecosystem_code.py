#!/usr/bin/env python3
"""No private code is in this repository, and none can reach it.

    python3 tools/selftest_no_ecosystem_code.py

WHY THIS EXISTS

This repository is written to be handed to other people: a hackathon team, a
public submission, a judging panel. The author's private repositories are not.
A promise does not keep them apart. A person in a hurry copies a working module
across because it already solves the problem, and nothing objects. By the time
anyone notices, it is in somebody else's git history and cannot be recalled.

So this is the gate. It refuses, in order of how much harm it would do:

  A. A file in this repo is a copy of a file in a protected repo.
  B. A file imports a protected module.
  C. A file reads from a protected path at runtime.
  D. This repo sits INSIDE a protected repo, so committing here commits there.
  E. A secret of any kind is committed.
  F. The gate itself is pointed at nothing, and passes by vacuum.

WHAT IT PROTECTS IS NOT IN THIS FILE

The protected repositories, module names and path tokens are read from a
private file outside every repository (default ~/.config/cleanroom/private.json,
or the path in $CLEANROOM_PRIVATE). Writing them here would publish the very
names the gate exists to protect. Without that file the gate goes RED under F:
it cannot prove anything, so it does not pass. On any machine but the author's
this gate is expected to be red, and that is the honest reading.

F is the one that matters most. If the protected directories are missing,
renamed, or unreadable, every "no copy found" check passes trivially and the
gate reports GREEN while proving nothing. So the gate asserts FIRST that it can
actually see the thing it is searching, and goes RED if it cannot.
"""
import hashlib
import json
import os
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent
HOME = pathlib.Path.home()

PRIVATE_FILE = pathlib.Path(os.environ.get(
    "CLEANROOM_PRIVATE", str(HOME / ".config" / "cleanroom" / "private.json")))


def _load_private():
    """(roots, modules, path_tokens, error). Never raises."""
    try:
        d = json.loads(PRIVATE_FILE.read_text())
        roots = [pathlib.Path(os.path.expanduser(r))
                 for r in d.get("protected_roots", [])]
        return (roots, set(d.get("protected_modules", [])),
                list(d.get("protected_path_tokens", [])), "")
    except Exception as exc:
        return [], set(), [], "%s: %s" % (type(exc).__name__, exc)


PROTECTED, PROTECTED_MODULES, PROTECTED_PATHS, PRIVATE_ERR = _load_private()

SECRET = re.compile(
    r"(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}"
    r"|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----"
    r"|sk_live_[A-Za-z0-9]{10,}|rk_live_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{20,}"
    r"|://[^/\s:]+:[^/\s@]{4,}@)"
)

TEXT_SUFFIXES = {".py", ".lua", ".sh", ".js", ".ts", ".html", ".css", ".md",
                 ".json", ".yml", ".yaml", ".txt", ".toml", ".cfg"}

FAILS = []


def check(name, cond, detail=""):
    ok = bool(cond)
    print(("  ok   " if ok else "  FAIL ") + name + (("  -- " + detail) if (detail and not ok) else ""))
    if not ok:
        FAILS.append(name)


def own_files():
    """Every file this repository would hand to somebody else."""
    out = []
    for p in HERE.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(HERE)
        parts = set(rel.parts)
        if parts & {".git", "__pycache__", ".venv", "node_modules", "logs"}:
            continue
        # THE GATE DOES NOT JUDGE ITSELF.
        #
        # This file is deployed into every clean room from one canonical copy
        # that lives inside a protected repo, so it is byte-identical to a
        # protected file on purpose. Without this line it reports itself as a
        # copied protected file and every new project is born red.
        #
        # This is the only exemption and it is narrow: one exact filename,
        # never a directory and never a pattern. Its integrity is not taken on
        # trust either -- CLEANROOM.sha256 records the canonical hash and
        # `new_clean_room.py --check` compares the deployed copy against it,
        # because a quietly weakened gate is how a breach ships.
        if p.resolve() == pathlib.Path(__file__).resolve():
            continue
        out.append(p)
    return out


def digest(path):
    """Hash of the file with whitespace-only differences ignored.

    A copy that has been reindented or had its line endings changed is still a
    copy. Hashing the raw bytes would miss exactly the copy somebody made by
    pasting into an editor.
    """
    try:
        raw = path.read_bytes()
    except Exception:
        return None
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return hashlib.sha256(raw).hexdigest()
    norm = re.sub(r"\s+", " ", text).strip()
    if len(norm) < 200:          # too short to be a meaningful copy
        return None
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


# ── the protected-digest cache ─────────────────────────────────────────────
#
# Hashing 36,746 protected files takes 38.5 seconds, measured 2026-10-04. A
# gate that slow does not get run, and CLAUDE.md already records the lesson
# that a selftest nobody runs is a comment. With open source projects and
# competitions ongoing, this gate runs constantly or it runs never.
#
# So the digests are cached, keyed on a fingerprint of the protected repos' SHAPE:
# every file's path, size and modification time. Cheap to build because it
# stats rather than reads. If ANY tracked file is added, removed, resized or
# touched, the fingerprint changes and everything is rehashed. A cache that
# could survive a change to what it summarises would be worse than no cache,
# because the gate would pass against a protected that no longer exists.
#
# The cache lives outside every repository. Inside a public project it would
# be shipped, and inside the protected it would be a file the gate then has to
# reason about.
CACHE_DIR = pathlib.Path.home() / ".cache" / "cleanroom"


def _eco_fingerprint(files):
    h = hashlib.sha256()
    for p in sorted(files):
        try:
            st = p.stat()
        except OSError:
            continue
        h.update(("%s|%d|%d\n" % (p, st.st_size, st.st_mtime_ns)).encode())
    return h.hexdigest()


def _eco_digests_cached(eco_files):
    """{digest: path} for the protected, rehashed only when it has changed."""
    fp = _eco_fingerprint(eco_files)
    cache = CACHE_DIR / ("%s.json" % fp)
    if cache.is_file():
        try:
            d = json.loads(cache.read_text())
            if isinstance(d, dict) and d:
                return {k: pathlib.Path(v) for k, v in d.items()}
        except Exception:
            pass
    out = {}
    for p in eco_files:
        d = digest(p)
        if d:
            out.setdefault(d, p)
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        # one fingerprint, one file. A stale cache is never read because its
        # name can no longer be computed from the protected as it stands.
        for old in CACHE_DIR.glob("*.json"):
            old.unlink()
        cache.write_text(json.dumps({k: str(v) for k, v in out.items()}))
    except OSError:
        pass
    return out


def main() -> int:
    print()
    print("  NO PROTECTED CODE")
    print("  " + "-" * 62)

    mine = own_files()

    # ── F · the gate can see what it is searching ───────────────────────────
    # Checked FIRST. Everything below is meaningless if this is false.
    check("F PLANTED the private list loaded and names something to protect",
          PROTECTED and not PRIVATE_ERR,
          "cannot read %s (%s)" % (PRIVATE_FILE, PRIVATE_ERR or "no protected_roots"))
    visible = [r for r in PROTECTED if r.is_dir()]
    check("F PLANTED the gate can actually see the protected repos",
          len(visible) == len(PROTECTED),
          "missing: %s" % [str(r) for r in PROTECTED if not r.is_dir()])

    eco_files = []
    for root in visible:
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            # NOT PROTECTED SOURCE, and so not a breach to match against.
            #
            # Measured 2026-10-04: 20,314 of 36,747 scanned files, 55%, were
            # vendor or archive. node_modules and dist are third-party or built
            # output, and a public project copying from node_modules has copied
            # a public npm package, not our work. _archive and backups are dead
            # duplicates of files that are still checked in their live form.
            # logs are runtime state.
            #
            # Dropping them makes the gate both faster and more correct: every
            # match it reports now points at real protected source.
            if set(p.parts) & {".git", "__pycache__", "node_modules",
                               "_archive", "backups", "dist", "logs",
                               ".venv", "build"}:
                continue
            if p.suffix.lower() in TEXT_SUFFIXES:
                eco_files.append(p)
    check("F and it read a substantial number of protected files",
          len(eco_files) > 200, "only read %d" % len(eco_files))
    check("F and it has files of its own to judge", len(mine) > 0,
          "this repo appears empty")

    # ── D · this repo is not nested inside a protected repo ────────────────
    inside = [str(r) for r in PROTECTED if r in HERE.parents or r == HERE]
    check("D PLANTED this repo is not inside a protected repo",
          not inside, "nested under: %s" % inside)

    # ── A · no file here is a copy of a file there ──────────────────────────
    eco_digests = _eco_digests_cached(eco_files)
    copies = []
    for p in mine:
        if p.suffix.lower() not in TEXT_SUFFIXES:
            continue
        d = digest(p)
        if d and d in eco_digests:
            copies.append("%s == %s" % (p.relative_to(HERE), eco_digests[d]))
    check("A PLANTED no file here is a copy of a protected file",
          not copies, "; ".join(copies[:3]))

    # ── B · no file imports a protected module ─────────────────────────────
    bad_imports = []
    for p in mine:
        if p.suffix != ".py":
            continue
        try:
            src = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for m in re.finditer(r"^\s*(?:from|import)\s+([A-Za-z_][\w.]*)", src, re.M):
            root = m.group(1).split(".")[0]
            if root in PROTECTED_MODULES:
                bad_imports.append("%s imports %s" % (p.relative_to(HERE), m.group(1)))
    check("B PLANTED no file imports a protected module",
          not bad_imports, "; ".join(bad_imports[:3]))

    # ── C · no file reaches a protected path at runtime ────────────────────
    # This file names those paths on purpose, so it exempts itself by identity
    # rather than by a pattern that would also exempt a real offender.
    self_path = pathlib.Path(__file__).resolve()
    reaches = []
    for p in mine:
        if p.resolve() == self_path or p.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            src = p.read_text(encoding="utf-8")
        except Exception:
            continue
        code = "\n".join(re.sub(r"(#|//|--).*$", "", ln) for ln in src.splitlines())
        for token in PROTECTED_PATHS:
            if token in code:
                reaches.append("%s mentions %s" % (p.relative_to(HERE), token))
                break
    check("C PLANTED no file reaches into a protected path",
          not reaches, "; ".join(reaches[:3]))

    # ── E · nothing secret is committed ─────────────────────────────────────
    leaked = []
    for p in mine:
        if p.resolve() == self_path or p.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            src = p.read_text(encoding="utf-8")
        except Exception:
            continue
        if SECRET.search(src):
            leaked.append(str(p.relative_to(HERE)))
    check("E PLANTED no secret is committed", not leaked, ", ".join(leaked[:3]))

    print()
    if FAILS:
        print("  no-protected-code gate RED - %d failing\n" % len(FAILS))
        return 1
    print("  no-protected-code gate GREEN - %d files here, checked against %d there\n"
          % (len(mine), len(eco_files)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
