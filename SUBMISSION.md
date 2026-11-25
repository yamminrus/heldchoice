# Held Choice: Devpost submission

Paste each section into the matching Devpost field. Everything is filled in; nothing is left to complete.

Fill each field one at a time and save after each. Devpost has been known to drop fields when several are changed at once.

---

## Project name

Held Choice

## Elevator pitch (200 characters max)

Six choices on the road to the Emerald City. Your private reflection runs on-device with Gemini Nano; a longer summary goes to the cloud only if you ask. The AI never grades you.

## Track

Web (Chrome). Also eligible for the Grand Prize.

## Try it out

- Live app: https://heldchoice.web.app
- Source (Apache-2.0): https://github.com/yamminrus/heldchoice

## Video demo

https://youtu.be/BtpVDcEAGts (2:24, captioned)

---

## About the project

### Inspiration

Reflection tools ask for the most private thing a person has: what they wrote about a hard choice. Most of them send it straight to a server. We wanted to show that the private part can stay on the device, that the heavier cloud model can be kept for what a person chooses to share, and that an AI can help someone reflect without ever grading them.

### What it does

Held Choice walks you through six moments from L. Frank Baum's *The Wonderful Wizard of Oz* (1900, public domain):

- the Lion at the Kalidah ditch
- the Scarecrow's plan at the log
- the Tin Woodman and the beetle
- the poppy field
- the Golden Cap
- the humbug behind the screen

Every choice costs something, and none is marked right. After you choose, **the load rises**: the cost of your choice gets heavier, and you decide whether to keep it or change it.

After each moment you can write a private note and ask for a **private reflection**, written on your device. At the end, the grey sky over home holds a colour for every choice you kept under load. Grey patches show where the load moved you, which is information, not a mark against you. You can then opt in to a **longer summary** of the pattern you walked.

### How we built it

Held Choice routes inference by **how private the input is**, using Firebase AI Logic hybrid inference:

| Job | Input | Mode | If unavailable |
|---|---|---|---|
| Private reflection | Your choice plus your private note | `ONLY_ON_DEVICE` (Gemini Nano in Chrome) | A plain-code reflection; **nothing is sent** |
| Longer summary | Only the six choices, after a consent box | `PREFER_IN_CLOUD` (falls back to on-device offline) | A clear "not available" message |

- `ONLY_ON_DEVICE` is the privacy guarantee. It throws rather than falling back to the cloud, so a private note cannot leave the machine by accident. The app catches that and writes the reflection in plain code instead.
- Every response shows where it was written ("on this device", "in the cloud", or "by plain code"), using the SDK's `inferenceSource`.
- `initializeDeviceModel()` is called on the user's first click, as Chrome's user-activation rule requires.
- **App Check** with reCAPTCHA Enterprise protects the Gemini API and is enforced for AI Logic.
- **The AI never judges.** A system instruction forbids grading, and `js/guard.js` checks every generated text before display. Scores, percentages, "right choice", "you should have" and verdicts on the person are blocked, and the plain-code reflection is shown instead, with a note saying why.
- **The rules of the walk are plain, tested code** (`js/hold.js`): choose, the load rises, keep or change. No number about the person is ever produced.
- Plain HTML, CSS and JavaScript with no build step. The Firebase JS SDK 13.4.0 loads from Google's CDN. Hosted on Firebase Hosting.

### Challenges we ran into

- **Keeping the private path private.** `PREFER_ON_DEVICE` would quietly send a note to the cloud whenever the device model was missing. Using `ONLY_ON_DEVICE` for the note, with a plain-code fallback, made "private" something the code enforces rather than something we promise.
- **Keeping the AI out of judgment.** A prompt alone is a request, not a guarantee, so we added a code guard with tests. The tests include planted failures, to prove the guard can catch them.
- **The inference badge.** In SDK 13.4.0, `inferenceSource` comes back as lowercase `in_cloud` rather than the `IN_CLOUD` shown in the docs, so our first badge said "written by plain code" for cloud text. Normalising the value fixed it.
- **Keys and a public repo.** The Firebase web config lives outside the repository. A staging script runs the checks first, then assembles the deployable site in a separate folder, so the public repo never holds a key.

### Accomplishments that we're proud of

- A hybrid design where the inference mode carries the privacy promise.
- An AI feature that helps someone reflect and is provably kept from grading them.
- Story material adapted directly from a public-domain book (silver shoes, not ruby), with every choice given a real cost.

### What we learned

- Hybrid inference is most useful when routing follows the data, not just speed or cost.
- On-device inference is single-turn and limited to 9,216 tokens, which suits short, private reflections well.
- Showing the user where each response was generated builds more trust than any privacy paragraph.

### What's next

- Streamed reflections.
- More public-domain stories.
- A group mode where each person's reflection stays on their own device and only consented summaries are shared.

---

## Built with

firebase-ai-logic, gemini-nano, gemini, chrome-prompt-api, firebase-app-check, recaptcha-enterprise, firebase-hosting, javascript, html, css

## How Firebase AI Logic is used (for the judges)

- `js/ai.js` imports `getAI`, `getGenerativeModel`, `GoogleAIBackend` and `InferenceMode` from `firebase/ai` (SDK 13.4.0). It creates two models:
  - The reflection model uses `InferenceMode.ONLY_ON_DEVICE` with `onDeviceParams` (system prompt, English in and out).
  - The summary model uses `InferenceMode.PREFER_IN_CLOUD` with `inCloudParams` (`gemini-3.5-flash-lite`, system instruction, output cap).
- The code calls `initializeDeviceModel()` on a user gesture and `generateContent()` for each request, and reads `response.inferenceSource` to label each result.

## Testing instructions

1. Open https://heldchoice.web.app in **Chrome desktop 139 or later**.
2. For on-device reflections:
   - Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and restart Chrome.
   - On the first reflection, Chrome downloads Gemini Nano, which can take several minutes.
3. Click **Begin the road**. Choose, keep or change under load, write an optional note, and click **Reflect privately**. The badge shows **Written on this device**.
4. At the end, tick the consent box and click **Write a summary**. The badge shows **Written in the cloud**.
5. Without the flag or the model, reflections are written by plain code, and the app says nothing was sent.

On-device reflection tested on the live site on November 25, 2026, in Chrome 158.0.8127.38 on macOS: the reflection returned with the "Written on this device" badge, and no generation request left the browser. The first on-device reflection can take a few minutes while Gemini Nano warms up.

## Built during the submission period

The repository was created empty on November 24, 2026, inside the submission period (Nov 11 to Nov 30, 2026). All code, the story adaptation, tests and documentation were written during the period. No pre-existing code is included. Third-party code: the Firebase JS SDK (Apache-2.0), loaded from Google's CDN.
