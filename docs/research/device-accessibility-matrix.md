# Device, performance, and accessibility matrix

[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) targets Android 7+ and iOS
16.4+. The supported product matrix may be narrower, but it must be declared
before testing.

## Required physical-device classes

| Class | Minimum coverage |
|---|---|
| Current iPhone | newest supported iOS, standard display |
| Older iPhone | oldest supported iOS/device the product claims |
| Current Android | current supported Android, reference-class device |
| Constrained Android | oldest supported Android, low memory/slower CPU |

Record exact model, OS, screen size, locale, font scale, reduced-motion setting,
network profile, build SHA, and tester. Emulators may supplement but not replace
these rows.

## Run on every device

- cold and warm launch; slow/offline launch recovery;
- age gate, safe target explanation, and first real meal;
- ten standard logs plus recent/favorite/manual/AI failure paths;
- background and relaunch with a draft and with an unsynced accepted log;
- keyboard, safe areas, camera/photo permissions, deep links, haptics, and local
  notifications;
- pause, freeze, DST/local-day, export, reset, restore, sign-out, and session
  expiry;
- large text/font scale, screen reader, switch/keyboard navigation where
  applicable, zoom, contrast, reduced motion, and touch target sizing.

## Budgets

- warm launch to usable Home: ≤1.0 second;
- cold launch to usable state on the older device: ≤2.5 seconds;
- p75 standard non-AI log: ≤20 seconds;
- interaction response: visible acknowledgement within 100 ms;
- crash-free internal sessions: ≥99.8%.

Use `docs/research/logging-speed-protocol.md` for timing. Store only synthetic or
participant-consented data, and attach the completed matrix to release evidence.
