// Hybrid inference with Firebase AI Logic.
//
// Two jobs, routed by how private the input is:
//
//   reflection  Uses the person's own private note. ONLY_ON_DEVICE: Gemini Nano
//               in Chrome. If the device model is not available, nothing is
//               sent anywhere; a plain-code reflection is shown instead.
//
//   summary     Uses only the choices made (no private notes), and only after
//               the person opts in. PREFER_IN_CLOUD: a cloud Gemini model writes
//               the longer summary; offline, it falls back to the device model.
//
// Neither job scores. Every output passes guard.judges() before it is shown.

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app-check.js";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-ai.js";

import { judges, tidy } from "./guard.js";

const RULES =
  "You reflect a person's choice back to them. Never judge it. Never call any " +
  "choice right, wrong, better or worse. Never praise or blame the person. " +
  "Never use numbers, scores, grades or ratings. Do not tell them what they " +
  "should have done. Write plainly, in second person, with no lists.";

let reflectModel = null;
let summaryModel = null;
let ready = false;
let deviceState = "unknown"; // unknown | downloading | ready | unavailable

export function aiConfigured(config) {
  return !!(config && config.firebase && config.firebase.apiKey && config.appCheckSiteKey);
}

export function initAI(config) {
  if (ready) return true;
  if (!aiConfigured(config)) return false;
  const app = initializeApp(config.firebase);
  // Debug tokens only on localhost, per the App Check docs. Never in a deployed build.
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  const onDeviceParams = {
    createOptions: {
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: "system", content: [{ type: "text", value: RULES }] }],
    },
  };
  reflectModel = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_ON_DEVICE,
    onDeviceParams,
  });
  summaryModel = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_IN_CLOUD,
    inCloudParams: {
      model: config.cloudModel || "gemini-3.5-flash-lite",
      systemInstruction: RULES,
      generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
    },
    onDeviceParams,
  });
  ready = true;
  return true;
}

// Must be called on a user gesture (Chrome's user-activation rule).
export function warmDeviceModel(onProgress) {
  if (!reflectModel) return;
  deviceState = "downloading";
  try {
    const p = reflectModel.initializeDeviceModel((v) => onProgress && onProgress(v));
    Promise.resolve(p)
      .then(() => (deviceState = "ready"))
      .catch(() => (deviceState = "unavailable"));
  } catch {
    deviceState = "unavailable";
  }
}

export function getDeviceState() {
  return deviceState;
}

async function run(model, prompt) {
  const result = await model.generateContent(prompt);
  const text = tidy(result.response.text());
  // The docs show ON_DEVICE / IN_CLOUD; SDK 13.4.0 returns "on_device" / "in_cloud".
  // Normalise so the badge is right either way.
  const source = String(result.response.inferenceSource || "UNKNOWN").toUpperCase();
  const hit = judges(text);
  if (hit) return { ok: false, blocked: hit, source };
  return { ok: true, text, source };
}

// Private reflection. The note never leaves the device: ONLY_ON_DEVICE throws
// rather than falling back to the cloud.
export async function reflect({ situation, choice, kept, note }) {
  if (!reflectModel) return { ok: false, reason: "not-configured" };
  const prompt =
    `Story: ${situation.scene}\n` +
    `They chose: ${choice.text} (cost: ${choice.cost})\n` +
    `When the load rose (${choice.load}) they ${kept ? "kept that choice" : "changed their choice"}.\n` +
    (note ? `Their private note: ${note}\n` : "") +
    "In two or three sentences, reflect back what this choice carried and cost. " +
    "End with one open question they could sit with. Do not judge.";
  try {
    return await run(reflectModel, prompt);
  } catch (e) {
    return { ok: false, reason: "device-unavailable", detail: String(e && e.message) };
  }
}

// Longer summary. Opt-in only; sends the choices, never the notes.
export async function summarize(recordRows) {
  if (!summaryModel) return { ok: false, reason: "not-configured" };
  const lines = recordRows
    .map((r) => `- ${r.title}: chose "${r.chose}" (carried: ${r.carried}); ${r.kept ? "kept it under load" : "changed it under load"}.`)
    .join("\n");
  const prompt =
    "Here is a walk through six situations from The Wonderful Wizard of Oz.\n" +
    lines +
    "\nWrite one short paragraph describing the pattern of costs this person chose to carry, " +
    "and where the load moved them. Describe; do not evaluate. Close with one question for them.";
  try {
    return await run(summaryModel, prompt);
  } catch (e) {
    return { ok: false, reason: "unavailable", detail: String(e && e.message) };
  }
}
