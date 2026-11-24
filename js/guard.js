// The AI phrases. It never judges.
//
// The models are told not to grade, rank or call a choice right or wrong. A
// prompt is a request, not a guarantee, so every generated text passes through
// this check before anyone sees it. If it fails, the plain-code reflection is
// shown instead and the screen says so.

const JUDGING = [
  /\b\d+(\.\d+)?\s*(\/|out of)\s*\d+/i, // 7/10, 4 out of 5
  /\b\d+(\.\d+)?\s*%/, // 80%
  /\b(score|scored|scores|grade|graded|rating|rated|rank|ranked|ranking|points?)\b/i,
  /\b(right|wrong|correct|incorrect|best|worst|better|worse)\s+(choice|answer|decision|option|thing to do)\b/i,
  /\byou\s+(should|ought to|must)\s+have\b/i,
  /\b(good|bad|weak|strong|brave|cowardly|selfish|admirable)\s+(person|character|man|woman|people)\b/i,
  /\byou\s+(are|were)\s+(brave|a coward|cowardly|selfish|wise|foolish|weak|strong|good|bad)\b/i,
  /\b(passed|failed)\b/i,
];

export function judges(text) {
  if (typeof text !== "string") return "not text";
  for (const rx of JUDGING) {
    const m = text.match(rx);
    if (m) return m[0];
  }
  return null;
}

// Keep it short and plain. Over-long output is trimmed at a sentence end.
export function tidy(text, maxChars = 700) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return end > 80 ? cut.slice(0, end + 1) : cut;
}
