# Held Choice: submission text (draft)

## Tagline

Six choices on the road to the Emerald City. A private reflection on your device, a longer summary in the cloud only if you ask.

## What it does

Held Choice walks you through six moments from L. Frank Baum's *The Wonderful Wizard of Oz* (1900, public domain):

- the Lion at the Kalidah ditch
- the Scarecrow's plan at the log
- the Tin Woodman's beetle
- the poppy field
- the Golden Cap
- the humbug behind the screen

Every choice has a cost, and none is marked right. After you choose, the load rises: the cost of the choice you made gets heavier, and you decide whether to keep your choice or change it.

After each moment you can write a private note and ask for a reflection. At the end, the grey sky over home holds a colour for every choice you kept. You can then ask for a longer summary of the pattern.

## How it uses Firebase AI Logic hybrid inference

Held Choice routes inference by **how private the input is**, not only by speed or cost.

- **Private reflection: `ONLY_ON_DEVICE`.** Gemini Nano in Chrome reads your choice and your private note. If the device model is not available, the app writes the reflection in plain code and sends nothing. The note never leaves the device, because the inference mode does not allow a cloud fallback.
- **Longer summary: `PREFER_IN_CLOUD`, opt-in.** Only the six choices are sent, never the notes, and only after you tick a consent box. Offline, the summary falls back to the device model.
- **Transparency:** every response shows where it was written, using `inferenceSource`.
- **App Check:** protects the Gemini API.

## The AI never judges

The model phrases; it never scores, ranks or grades, and never calls a choice right or wrong. A system instruction forbids it. Then a code guard checks every generated text before display and replaces any judging output with a plain-code reflection, saying why. The rules of the walk are ordinary, tested code.

## Value proposition

Reflection tools usually ask people to send their most private thoughts to a server. Held Choice shows a different default: the private part stays on the device, the heavier cloud model is used only for what the person chooses to share, and the AI is kept out of judging people entirely. The same pattern fits any app that handles personal reflection, such as journaling, coaching or learning, where trust is the product.

## Built with

Firebase AI Logic (JS SDK 13.4.0, hybrid inference), Gemini Nano via Chrome's Prompt API, a cloud Gemini model through the Gemini Developer API, Firebase App Check with reCAPTCHA Enterprise, and Firebase Hosting. Plain HTML, CSS and JavaScript, with no build step.

## Built during the submission period

The repository was created empty on 2026-11-24. All code, story adaptation, tests and documentation were written during the submission period.
