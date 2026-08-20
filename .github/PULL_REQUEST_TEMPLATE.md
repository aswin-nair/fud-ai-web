## Outcome

<!-- What user-visible or operational outcome does this change deliver? -->

## Acceptance criterion

<!-- Link the product requirement, release gate, defect, or experiment plan. -->

## Guardrails reviewed

- [ ] Age/target/BMI safety is unchanged or covered by boundary tests
- [ ] Logging—not calorie compliance—drives streaks/rewards
- [ ] No moralizing copy or nutrition use of danger styling
- [ ] BYOK keys, tokens, food text/photos, body data, and chat content are absent from analytics/logs
- [ ] Local-day/DST, pause, retry, duplicate, and account-switch behavior were considered
- [ ] Export, deletion, migration, or retention disclosures were updated if data flow changed

## Verification

<!-- Commands, CI links, device/browser rows, screenshots, and reviewer evidence. -->

- [ ] Relevant unit/contract tests
- [ ] Typecheck, lint, and production build
- [ ] Browser/device flow where applicable
- [ ] Accessibility/keyboard/screen-reader behavior where applicable
- [ ] No real user data or credentials in fixtures, screenshots, or reports

## Rollback and observability

<!-- How is this disabled/reverted, and which safe aggregate signal confirms health? -->
