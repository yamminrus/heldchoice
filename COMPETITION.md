# Competition submission checklist: #BuildHybridAI 2026

Rules: https://firebasehybridaihackathon.devpost.com/rules (read 2026-11-24).
Deadline: **Monday Nov 30, 2026, 2:00 PM PT.** Track: Web (Chrome), Best Web/Chrome ($3,000), plus Grand Prize eligibility.

| Requirement (from the rules) | Status |
|---|---|
| Built with Firebase AI Logic, Web (Chrome), Gemini Nano via Firebase AI Logic | Done in code (`js/ai.js`) |
| Firebase AI Logic imported and actually called at runtime | Done (`getAI`, `getGenerativeModel`, `generateContent`, `initializeDeviceModel`) |
| App Check (debug tokens accepted) | Done in code. **Needs the Firebase project and reCAPTCHA Enterprise key.** |
| Public repo on GitHub or GitLab | Not yet. Push only after `bash tools/gate_cycle.sh` is green. |
| Open source license, visible in the repo's About section | Apache-2.0 in `LICENSE`, byte-identical to apache.org |
| No production keys, secrets or personal data in the repo | `js/config.js` git-ignored; the gate checks for secrets |
| Working project link for judges | Not yet: deploy to Firebase Hosting after the project exists |
| Demo video under 3 minutes, on YouTube | Script in `DEMO_SCRIPT.md`. Recording not done. |
| Text description: features, Firebase AI Logic use, value proposition | Draft in `SUBMISSION.md` |
| Summary of what was built during the submission period | Everything here: repository created 2026-11-24, inside the window (Nov 11 to Nov 30) |
| English | Yes |

## Before state

The repository was created empty on 2026-11-24 by the clean-room scaffold. There was no prior code. Every file was written during the submission period.

## The gate

`bash tools/gate_cycle.sh` must be green before anything is pushed public. If it is red, the repository is not safe to publish, whatever the deadline says.
