// Plain-code tests: node --test tests/   (no dependencies)
import test from "node:test";
import assert from "node:assert/strict";
import { SITUATIONS } from "../js/situations.js";
import { newWalk, choose, underLoad, record, sky, leapOpen, isComplete } from "../js/hold.js";
import { judges, tidy } from "../js/guard.js";
import { plainReflection } from "../js/plain.js";

test("every situation has three choices, each with a cost and a load", () => {
  assert.equal(SITUATIONS.length, 6);
  for (const s of SITUATIONS) {
    assert.equal(s.choices.length, 3, s.id);
    for (const c of s.choices) {
      assert.ok(c.text && c.cost && c.load && c.carries, s.id);
      assert.equal(c.right, undefined, "no choice may be marked right");
    }
  }
});

test("story stays with the 1900 book, not the 1939 film", () => {
  const all = JSON.stringify(SITUATIONS).toLowerCase();
  for (const w of ["ruby", "slipper", "dream", "somewhere over"]) assert.ok(!all.includes(w), w);
});

test("the leap opens only when every situation is answered under load", () => {
  const w = newWalk(SITUATIONS);
  SITUATIONS.forEach((s, i) => {
    assert.equal(leapOpen(w), false);
    choose(w, s.id, 0);
    i % 2 ? underLoad(w, s.id, true) : underLoad(w, s.id, false, 1);
  });
  assert.equal(isComplete(w), true);
  assert.equal(leapOpen(w), true);
});

test("a kept choice adds a colour; a changed one stays grey", () => {
  const w = newWalk(SITUATIONS);
  choose(w, "ditch", 0); underLoad(w, "ditch", true);
  choose(w, "log", 0); underLoad(w, "log", false, 2);
  const [a, b, c] = sky(w);
  assert.equal(a.state, "kept"); assert.ok(a.colour);
  assert.equal(b.state, "changed");
  assert.equal(c.state, "unanswered");
});

test("the record carries no number about the person", () => {
  const w = newWalk(SITUATIONS);
  for (const s of SITUATIONS) { choose(w, s.id, 1); underLoad(w, s.id, true); }
  const rows = record(w, SITUATIONS);
  for (const r of rows) assert.deepEqual(Object.keys(r).sort(), ["carried", "chose", "id", "kept", "title"]);
});

test("a change must be to a different choice", () => {
  const w = newWalk(SITUATIONS);
  choose(w, "cap", 1);
  assert.throws(() => underLoad(w, "cap", false, 1));
  assert.throws(() => underLoad(w, "cap", false));
});

test("guard blocks judging language", () => {
  for (const bad of [
    "That was the right choice.", "I'd rate this 8/10.", "You scored well.",
    "You are brave.", "You should have stayed.", "About 80% of people agree.",
    "You failed the test.", "a good person would", "the wrong answer",
  ]) assert.ok(judges(bad), bad);
});

test("guard lets plain reflection through", () => {
  for (const ok of [
    "You chose to stand at the edge while the others crossed, and you stayed afraid the whole time. What did it ask of you?",
    plainReflection({ choice: SITUATIONS[0].choices[0], kept: true }),
    plainReflection({ choice: SITUATIONS[5].choices[1], kept: false }),
  ]) assert.equal(judges(ok), null, ok);
});

test("every plain reflection passes the guard", () => {
  for (const s of SITUATIONS) for (const c of s.choices) for (const kept of [true, false])
    assert.equal(judges(plainReflection({ choice: c, kept })), null, s.id);
});

test("tidy trims long output at a sentence end", () => {
  const long = "A sentence here. ".repeat(80);
  const t = tidy(long, 200);
  assert.ok(t.length <= 200 && t.endsWith("."));
});
