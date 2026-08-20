# Mobile signed-build and smoke checklist

This checklist prepares a release; it is not evidence that a build or hardware
test passed. Every checkbox starts open and must be completed against one exact
Git commit and one immutable EAS build URL.

## One-time project setup

- [ ] Confirm that `com.fudai.mobile` is the final Android application ID and
  iOS bundle identifier, and that the organization controls both registrations.
  Change it before the first signed store build if it is not the final identity;
  changing it later creates a different app.
- [ ] Sign in to the intended Expo organization and run `eas init` from
  `mobile/`. Commit the generated EAS project ID; do not invent or copy one from
  another project.
- [ ] Run `eas credentials` for each platform. Use the intended Apple team and
  Google Play signing key, grant least privilege, and record the credential
  owner and recovery process outside the repository. Never commit credentials.
- [ ] Confirm Apple App Store Connect and Google Play Console agreements,
  privacy declarations, age rating, support URL, and data-safety answers with
  the product/privacy owners.
- [ ] Decide and document iOS backup/restore handling for the SQLite log. App
  lock is not a backup control, and the privacy disclosure must match tested
  platform behavior.

The repository uses EAS remote developer-facing versions and production
`autoIncrement`. The user-facing version remains the explicit `version` in
`app.config.ts` and must be reviewed for every store release.

## Clean-checkout gate

Run from `mobile/` on supported Node 22.13 or newer:

```text
npm ci
npx expo install --check
npx expo-doctor
npm run typecheck
npm test
npm run lint
npx expo export --platform android --platform ios
```

- [ ] All commands pass from a clean checkout.
- [ ] `npx expo config --type public` shows the expected name, version,
  `com.fudai.mobile` identifiers, LocalAuthentication/SecureStore plugins, and
  Face ID purpose string. Confirm Android `allowBackup` is `false`; local
  SQLite data must not enter Google Drive Auto Backup implicitly.
- [ ] No secret, signing material, service-account JSON, provisioning profile,
  or private key appears in the repository or public config output.

## Internal signed builds

Build production-like internal artifacts without submitting them:

```text
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

The Android preview profile emits an installable APK. iOS internal distribution
requires registered test devices and appropriate ad hoc credentials. The
`preview-simulator` profile is useful for layout checks, but an iOS Simulator
artifact is not signed for a physical device and cannot validate Face ID.

- [ ] Record the commit SHA, EAS build URLs, app version, native build versions,
  dependency lockfile hash, tester, device, OS, and UTC test time.
- [ ] Install the artifacts through their intended distribution path rather
  than a development server.
- [ ] Verify fresh install, upgrade from the previous candidate, cold launch,
  background/resume, offline launch, log/edit/delete, pause, support links,
  dynamic type, screen reader, reduced motion, and dark/light appearance.
- [ ] Run the repository device/accessibility and logging-speed protocols and
  attach their completed evidence. Do not substitute simulator results for
  physical-device haptics, biometrics, camera, or performance evidence.

## App-lock hardware checks

Face ID is not supported in Expo Go. Exercise these checks on installed native
preview builds and real supported devices:

- [ ] A fresh install opens with app lock off and never prompts unexpectedly.
- [ ] Enabling requires a strong enrolled biometric and a successful OS prompt.
- [ ] Cancelling, timing out, or failing authentication keeps the app locked.
- [ ] The operating system can offer device-passcode fallback after biometric
  failures; Fud AI never receives or stores that passcode.
- [ ] Returning from the background shows the gate before app content and
  requires a fresh unlock without a prompt loop. Inspect app-switcher snapshots
  separately; this JavaScript gate does not promise screenshot suppression.
- [ ] A biometric enrollment change or removed device authentication produces
  the documented recovery path. Ordinary cancellation never shows that reset.
- [ ] A SecureStore read failure covers the log, offers retry, and labels a
  user-chosen session continuation as app lock unavailable.
- [ ] After uninstall/reinstall on iOS, an empty SQLite profile is not trapped
  behind a stale keychain preference.
- [ ] The web build says app lock is unavailable.
- [ ] Testers understand that app lock is a foreground screen gate. It does not
  encrypt the SQLite database, protect a compromised/rooted device, or replace
  the operating-system lock.

## Production candidate

After all repository release gates and external reviews pass:

```text
eas build --platform all --profile production
```

- [ ] Confirm the production build came from the reviewed, clean, protected
  commit and used the expected Expo organization and signing identities.
- [ ] Inspect Android signing certificate fingerprints and iOS signing/team
  details against the separately controlled credential record.
- [ ] Smoke the TestFlight/Play internal-testing artifacts again. A successful
  EAS compile alone is not release evidence.
- [ ] Attach immutable build URLs and completed evidence to
  `docs/release/evidence.json`; keep every release gate pending until its owner
  has supplied real evidence.
- [ ] Submit only after explicit release approval:

```text
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

- [ ] Monitor staged rollout, crashes, support, and rollback thresholds using
  the repository incident and beta-rollout runbooks.

## Current repository-only status

As of 2026-08-20, EAS profiles and native identity/configuration are present,
but no EAS project linkage, signing-credential verification, remote build,
physical-device smoke test, or store submission has been performed in this
workspace. Those remain release-blocking external evidence.

## Official references

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo SDK 57 LocalAuthentication](https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/)
- [Expo SDK 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [EAS build profiles](https://docs.expo.dev/build/eas-json/)
- [EAS app version management](https://docs.expo.dev/build-reference/app-versions/)
- [EAS signing credentials](https://docs.expo.dev/app-signing/app-credentials/)
