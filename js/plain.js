// The fallback reflection, written in plain code. Used when no model is
// available, when a model's output fails the guard, or when AI is off.
// It describes; it never judges.
export function plainReflection({ choice, kept }) {
  const cost = choice.cost.charAt(0).toLowerCase() + choice.cost.slice(1);
  return (
    `This choice put ${choice.carries} on the line: ${cost} ` +
    (kept
      ? "When it got heavier, you kept it."
      : "When it got heavier, you moved. That is worth noticing, not hiding.") +
    " What made this the cost you were willing to carry?"
  );
}
