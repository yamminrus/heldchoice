import { SITUATIONS } from "./situations.js";
import { newWalk, choose, underLoad, record, sky, leapOpen } from "./hold.js";
import { plainReflection } from "./plain.js";

// The AI layer is loaded only when this copy has a Firebase config, so the
// plain-code version works offline and without any network access at all.
let AI = null;

const $ = (sel) => document.querySelector(sel);
const view = $("#view");
let walk = newWalk(SITUATIONS);
let index = 0;
let aiOn = false;

// Config is optional: without it the app runs fully in plain code.
async function loadConfig() {
  try {
    const mod = await import("./config.js");
    return mod.CONFIG;
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return n;
}

function badge(source) {
  if (source === "ON_DEVICE") return el("span", { class: "badge device" }, "Written on this device");
  if (source === "IN_CLOUD") return el("span", { class: "badge cloud" }, "Written in the cloud");
  return el("span", { class: "badge plain" }, "Written by plain code, no AI");
}

function setStatus() {
  const s = $("#status");
  if (!aiOn) {
    s.textContent = "AI is off: this copy has no Firebase config, so everything runs in plain code.";
    return;
  }
  const d = AI.getDeviceState();
  s.textContent =
    d === "ready"
      ? "On-device model ready. Private reflections stay on this device."
      : d === "downloading"
      ? "On-device model is downloading. Reflections wait for it; nothing private is sent."
      : d === "unavailable"
      ? "No on-device model here. Reflections are written by plain code; nothing private is sent."
      : "Checking for an on-device model.";
}

function renderSky() {
  const strip = el("div", { class: "sky", role: "img", "aria-label": "The sky over home" });
  for (const p of sky(walk)) {
    const cell = el("div", { class: "patch " + p.state });
    if (p.colour) cell.style.background = p.colour;
    strip.append(cell);
  }
  return strip;
}

function intro() {
  view.replaceChildren(
    el("h1", {}, "Held Choice"),
    el("p", { class: "lede" }, "Six moments from the road to the Emerald City. Every choice costs something. After you choose, the cost gets heavier, and you decide whether to keep your choice."),
    el("p", {}, "Nothing is marked right. Nobody is scored. What you write stays on your device."),
    renderSky(),
    el("button", { class: "primary", onclick: () => { if (aiOn) AI.warmDeviceModel(() => setStatus()); setTimeout(setStatus, 50); showSituation(); } }, "Begin the road")
  );
}

function showSituation() {
  const s = SITUATIONS[index];
  const list = el("div", { class: "choices" });
  s.choices.forEach((c, i) => {
    list.append(
      el("button", { class: "choice", onclick: () => { choose(walk, s.id, i); showLoad(s, i); } },
        el("span", { class: "ctext" }, c.text),
        el("span", { class: "ccost" }, "Cost: " + c.cost))
    );
  });
  view.replaceChildren(
    el("p", { class: "step" }, `${index + 1} of ${SITUATIONS.length} · ${s.who}`),
    el("h2", {}, s.title),
    el("p", {}, s.scene),
    el("p", { class: "cost" }, s.cost),
    list,
    renderSky()
  );
  view.querySelector("h2").focus?.();
}

function showLoad(s, i) {
  const c = s.choices[i];
  const others = el("div", { class: "choices hidden" });
  s.choices.forEach((o, j) => {
    if (j === i) return;
    others.append(el("button", { class: "choice", onclick: () => { underLoad(walk, s.id, false, j); showReflect(s, j, false); } },
      el("span", { class: "ctext" }, o.text),
      el("span", { class: "ccost" }, "Cost: " + o.cost)));
  });
  view.replaceChildren(
    el("p", { class: "step" }, `${index + 1} of ${SITUATIONS.length} · ${s.who}`),
    el("h2", {}, "The load rises"),
    el("p", { class: "chosen" }, "You chose: " + c.text),
    el("p", { class: "load" }, c.load),
    el("div", { class: "row" },
      el("button", { class: "primary", onclick: () => { underLoad(walk, s.id, true); showReflect(s, i, true); } }, "Keep my choice"),
      el("button", { class: "secondary", onclick: () => others.classList.toggle("hidden") }, "Change my choice")),
    others
  );
}

function showReflect(s, i, kept) {
  const c = s.choices[i];
  const out = el("div", { class: "reflection", "aria-live": "polite" });
  const note = el("textarea", { id: "note", rows: "3", placeholder: "Optional private note. It never leaves this device." });
  const reflectBtn = el("button", { class: "secondary", onclick: async () => {
    reflectBtn.disabled = true;
    out.replaceChildren(el("p", { class: "muted" }, "Reflecting..."));
    let r = aiOn ? await AI.reflect({ situation: s, choice: c, kept, note: note.value.trim() }) : { ok: false, reason: "ai-off" };
    setStatus();
    if (r.ok) {
      out.replaceChildren(el("p", {}, r.text), badge(r.source));
    } else {
      const why = r.blocked
        ? "The model's wording judged you, so it was not shown."
        : r.reason === "device-unavailable"
        ? "No on-device model, and your note is private, so nothing was sent."
        : "";
      out.replaceChildren(el("p", {}, plainReflection({ choice: c, kept })), badge("PLAIN"), why ? el("p", { class: "muted" }, why) : "");
    }
  } }, "Reflect privately");
  const nextLabel = index + 1 < SITUATIONS.length ? "Next on the road" : "See where the road leads";
  view.replaceChildren(
    el("p", { class: "step" }, `${index + 1} of ${SITUATIONS.length} · ${s.who}`),
    el("h2", {}, kept ? "You kept it" : "You changed it"),
    el("p", { class: "chosen" }, (kept ? "Kept: " : "Now: ") + c.text),
    el("label", { for: "note" }, "What did this cost you?"),
    note,
    reflectBtn,
    out,
    el("button", { class: "primary", onclick: () => { index += 1; index < SITUATIONS.length ? showSituation() : showEnd(); } }, nextLabel),
    renderSky()
  );
}

function showEnd() {
  const rows = record(walk, SITUATIONS);
  const out = el("div", { class: "reflection", "aria-live": "polite" });
  const consent = el("input", { type: "checkbox", id: "consent" });
  const sumBtn = el("button", { class: "secondary", onclick: async () => {
    if (!consent.checked) { out.replaceChildren(el("p", { class: "muted" }, "Tick the box first. Nothing is sent without it.")); return; }
    sumBtn.disabled = true;
    out.replaceChildren(el("p", { class: "muted" }, "Writing the summary..."));
    const r = aiOn ? await AI.summarize(rows) : { ok: false, reason: "ai-off" };
    out.replaceChildren(...(r.ok
      ? [el("p", {}, r.text), badge(r.source)]
      : [el("p", { class: "muted" }, r.blocked ? "The model's wording judged you, so it was not shown." : "The summary is not available on this copy.")]));
  } }, "Write a summary");
  const list = el("ul", { class: "record" });
  for (const r of rows) list.append(el("li", {}, el("strong", {}, r.title + ": "), r.chose + " ", el("span", { class: "muted" }, r.kept ? "(kept under load)" : "(changed under load)")));
  view.replaceChildren(
    el("h2", {}, leapOpen(walk) ? "The world leaps" : "The road is not finished"),
    el("p", {}, "Home is still home. The grey sky over it now holds a colour for every choice you kept when it got heavier. Grey patches show where the load moved you. That is information, not a mark against you."),
    renderSky(),
    list,
    el("h3", {}, "A longer summary (optional)"),
    el("p", {}, "This sends only the six choices above to a cloud model. Your private notes are never sent."),
    el("p", { class: "muted" }, "This demo uses Google's free Gemini tier, where Google may use what is sent to improve its products. Only the six story choices are sent, and only if you tick the box."),
    el("div", { class: "row" }, consent, el("label", { for: "consent" }, "Send my six choices for a summary")),
    sumBtn,
    out,
    el("button", { class: "primary", onclick: () => { walk = newWalk(SITUATIONS); index = 0; intro(); } }, "Walk the road again")
  );
}

(async () => {
  const config = await loadConfig();
  if (config) {
    try {
      AI = await import("./ai.js");
      aiOn = AI.aiConfigured(config) && AI.initAI(config);
    } catch {
      aiOn = false; // CDN unreachable: carry on in plain code
    }
  }
  setStatus();
  intro();
})();
