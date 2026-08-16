# Meal-logging speed protocol

- Status: Ready for real-device execution; no timings have been fabricated
- Target: a realistic meal can be logged in under 20 seconds

## Device sample

Run at least five attempts on a supported iPhone and five on a supported Android device. Record model, OS, app build/commit, network condition, input method, and whether the install is fresh or returning. Include at least two offline/manual attempts and two correction flows.

## Start and stop

- Start when the tester intentionally presses the primary “Log” action.
- Stop when the saved meal is visible in the day history and the completion feedback has rendered.
- Do not exclude permission prompts, keyboard mistakes, AI retry time, corrections, or navigation errors.

## Trial record

| Trial | Device/build | Method | Meal scenario | Taps | Duration | Corrected? | Failure/retry | Notes |
|---|---|---|---|---:|---:|---|---|---|
| 1 | | Manual | Known calories/macros | | | | | |
| 2 | | Recent | Repeat a prior breakfast | | | | | |
| 3 | | Search | Common packaged food | | | | | |
| 4 | | Text AI | Mixed meal description | | | | | |
| 5 | | Photo AI | Mixed plate | | | | | |
| 6 | | Manual/offline | Known calories only | | | | | |
| 7 | | Recent | Repeat a prior lunch | | | | | |
| 8 | | Search | No-result then manual fallback | | | | | |
| 9 | | Text AI | Correct portion/macros before save | | | | | |
| 10 | | Photo AI | Retry or manual fallback | | | | | |

## Acceptance

- Report median, p90, success rate, correction rate, and retry/fallback rate; do not report only the fastest attempt.
- The median must be below 20 seconds, no accepted meal may disappear, and manual fallback must remain usable without a key or network.
- Any failure is assigned to navigation, input, AI/provider, persistence/sync, feedback, or accessibility before prioritization.
