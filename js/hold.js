// The sample rules. Plain code, no AI, no network.
//
// A walk through the six situations works like this:
//   1. You choose. Every choice has a cost.
//   2. The load rises: the cost of the choice you made gets heavier.
//   3. You keep your choice, or you change it.
//
// The record says what you chose and whether you kept it under load. It never
// says whether the choice was right, and it never turns a person into a number.
// Changing your mind under load is recorded as information, not as failure.

export function newWalk(situations) {
  return {
    order: situations.map((s) => s.id),
    steps: {}, // id -> { first, final, held }
  };
}

export function choose(walk, id, index) {
  if (!walk.order.includes(id)) throw new Error("unknown situation: " + id);
  if (walk.steps[id]) throw new Error("already chosen: " + id);
  walk.steps[id] = { first: index, final: null, held: null };
  return walk;
}

// After the load is shown: keep the first choice, or change to another one.
export function underLoad(walk, id, keep, newIndex = null) {
  const step = walk.steps[id];
  if (!step) throw new Error("choose before the load: " + id);
  if (step.held !== null) throw new Error("load already answered: " + id);
  if (keep) {
    step.final = step.first;
    step.held = true;
  } else {
    if (newIndex === null || newIndex === step.first) {
      throw new Error("a change needs a different choice");
    }
    step.final = newIndex;
    step.held = false;
  }
  return walk;
}

export function isComplete(walk) {
  return walk.order.every((id) => walk.steps[id] && walk.steps[id].held !== null);
}

// What the walk recorded, in words a person can read. No totals, no ranking.
export function record(walk, situations) {
  return walk.order
    .filter((id) => walk.steps[id] && walk.steps[id].held !== null)
    .map((id) => {
      const s = situations.find((x) => x.id === id);
      const step = walk.steps[id];
      const c = s.choices[step.final];
      return {
        id,
        title: s.title,
        chose: c.text,
        carried: c.carries,
        kept: step.held,
      };
    });
}

// The leap. Sample rule for this demo: the world leaps once every situation has
// been answered under load. Each situation where a choice was kept adds one
// colour to the sky; a changed choice leaves its patch grey. Grey is not a
// mark against anyone. It shows where the load moved you.
export const OZ_COLOURS = ["#1f6f43", "#c9a227", "#b23a2b", "#2b5fa8", "#7a3fa0", "#d9822b"];

export function sky(walk) {
  return walk.order.map((id, i) => {
    const step = walk.steps[id];
    if (!step || step.held === null) return { id, colour: null, state: "unanswered" };
    return step.held
      ? { id, colour: OZ_COLOURS[i % OZ_COLOURS.length], state: "kept" }
      : { id, colour: "#8a8f98", state: "changed" };
  });
}

export function leapOpen(walk) {
  return isComplete(walk);
}
