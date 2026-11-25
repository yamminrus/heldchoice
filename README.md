# Held Choice

Six choices on the road to the Emerald City. Every choice costs something. After you choose, the cost gets heavier, and you decide whether to keep your choice. A private reflection is written **on your device**. A longer summary is written **in the cloud only if you ask**, and it never sees your private notes.

**Live:** https://heldchoice.web.app

Built for **#BuildHybridAI 2026** with **Firebase AI Logic hybrid inference** (Web / Chrome).

## Why hybrid, and why this split

Most hybrid apps route by cost or speed. Held Choice routes by **how private the input is**.

| Job | Input | Inference mode | If no model is available |
|---|---|---|---|
| Private reflection | Your choice, plus your optional private note | `ONLY_ON_DEVICE` (Gemini Nano in Chrome) | A plain-code reflection. **Nothing is sent.** |
| Longer summary | Only the six choices you made, after you tick a consent box | `PREFER_IN_CLOUD` (cloud Gemini, falls back to on-device when offline) | A clear "not available" message |

On Google's free Gemini tier, Google may use what is sent to its cloud models to improve its products. The consent screen says so, and the summary is the only thing that is ever sent.

The private note is never sent anywhere. That is enforced by the inference mode, not by a promise: `ONLY_ON_DEVICE` throws rather than falling back to the cloud, and the app catches that and writes the reflection in plain code instead. Each response shows where it was written ("on this device", "in the cloud", or "by plain code"), using the SDK's `inferenceSource`.

## The AI never judges

The model phrases a reflection. It does not score, rank, grade, or call a choice right or wrong. That rule is enforced twice:

1. **In the prompt:** a system instruction forbids judging.
2. **In code:** every generated text passes `js/guard.js` before anyone sees it. Grades, percentages, "right choice", "you should have", "you are brave" and similar wording are blocked, and the plain-code reflection is shown instead, with a note saying why.

The rules of the walk are ordinary code in `js/hold.js`:

- You choose.
- The load rises.
- You keep your choice or change it.

The walk completes when all six situations have been answered under load. A kept choice adds a colour to the sky over home, and a changed choice leaves its patch grey. Grey is not a mark against anyone; it shows where the load moved you. No number about the person is ever produced.

These are **sample rules written for this demo**. They are deliberately simple.

## Story source

Adapted from L. Frank Baum, *The Wonderful Wizard of Oz* (1900), which is in the public domain in the United States. Everything comes from the book, not the 1939 film: the shoes are silver, and Oz is real.

## Run it

Plain-code mode needs no account and no network:

```bash
python3 -m http.server 8640 --bind 127.0.0.1
# open http://localhost:8640 in Chrome
```

With AI, using your own Firebase project:

1. Firebase console, **AI Services > AI Logic > Get started**. Choose the **Gemini Developer API** (no-cost tier).
2. Register a web app. Then go to **Security > App Check** and register the app with **reCAPTCHA Enterprise**.
3. Copy `js/config.example.js` to a file **outside this repository** (for example `../heldchoice_private/config.js`) and fill in the values. Then assemble the site outside the repository:

   ```bash
   bash tools/stage_site.sh ../heldchoice_site ../heldchoice_private/config.js
   cd ../heldchoice_site && python3 -m http.server 8640 --bind 127.0.0.1
   ```

   The script runs the gates first and refuses to stage inside the repository, so the public repository never holds a key.
4. For on-device inference, use **Chrome desktop 139 or later**. Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and restart Chrome.
5. On localhost the app turns on App Check debug mode. Register the debug token that appears in the console under **App Check > Manage debug tokens**. Never commit a debug token.

Deploy (optional): from the staged folder, `firebase deploy --only hosting --project <your-project>`.

## Tests

```bash
node --test tests/
```

No dependencies. The tests cover:

- Every situation has a cost and a load for each choice.
- The story uses nothing from the film.
- The walk only completes when all six are answered under load.
- The record contains no number about the person.
- The guard blocks judging language and passes every plain-code reflection.

## Libraries

The Firebase JS SDK 13.4.0 (Apache-2.0) is loaded in the browser from Google's CDN (`www.gstatic.com/firebasejs/13.4.0`). There is no build step and no `node_modules`.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.
