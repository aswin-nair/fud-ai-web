# Poiem

Brand name: **Poiem**. Visual wordmark and domain: **poiem** / **poiem.app**.
Pronunciation guide: **POY-em**. No “AI” suffix. Momo remains the mascot, not the brand name.

## The idea

Small everyday actions can become something of your own. Poiem is a warm, expressive master brand; food tracking is its first product, not its permanent definition. The name is inspired by the idea of making. We do not claim “poiem” is a literal dictionary translation or an established Greek word.

Current product line: **A little tracking. A lot of living.**
Short product descriptor: **Your food journal, with a little personality.**
Welcome line: **Your plate. Your pace.**

## Identity

The open-counter “p” is a maker’s stamp. It is intentionally not a fork, plate, leaf, or calorie symbol, so it can travel to future products. The custom lowercase geometric wordmark shares its open counters; the tilted persimmon dot gives it a small human irregularity.

- Use the wordmark as the default signature; the stamp is for app icons, avatars and small spaces.
- Wordmark minimum width: 96 px. Stamp minimum size: 24 px; favicon has a dedicated SVG export.
- Clear space: at least one dot-width around the wordmark, one stem-width around the stamp.
- Use ink artwork on paper; cream artwork on dark surfaces. A monochrome wordmark is supplied.
- Never stretch, outline, gradient-fill, or rotate the wordmark. Rotation belongs to supporting stickers.
- Momo may sit beside the brand, but must not replace the name in navigation or become embedded inside its letters.

## Palette and roles

| Color | Hex | Role |
| --- | --- | --- |
| Paper | `#FFF8EB` | Main light canvas, breathing space |
| Ink | `#26241F` | Text, outlines, logos |
| Persimmon | `#FF8055` | Primary actions, signature dot, app icon; use dark labels |
| Citron | `#F4DF70` | Celebration, editorial highlights; use dark labels |
| Leaf | `#BCDBB4` | Supportive success illustrations; use dark labels |
| Iris | `#5458C9` | Navigation/selection; white labels in light mode |
| Rose | `#EDBDD0` | Playful notes, never the sole indicator of an error |
| Night | `#191B1A` | Dark canvas, warm cream text |

Paper/ink dominate. Persimmon is the identifying accent; other colors support one purpose at a time. Dark mode uses raised olive-charcoal surfaces, brighter iris selection, and cream type. Do not reuse dark ink as body text on dark cards. Error states retain semantic red text, icons, and explicit copy.

## Type, layout, motion

The logo is paths, not a font dependency. Fredoka remains the expressive headline family; Plus Jakarta Sans is the readable interface family. Use short sentence-case headlines, bold labels, ample space around the primary action, 2–3 px outlines, and deliberate hard shadows. The existing food-collage composition stays for onboarding and signup.

Keep the current Motion primitives and reduced-motion support. Animate feedback, a sticker entrance, or Momo’s reactions—not the logo continuously. Never block a form, make text move while it is being read, or require motion to understand a state.

## Voice and Momo

Friendly, observant, gently mischievous. Talk like a person; keep instructions literal and jokes optional. Praise logging and returning, not eating less or changing body size. No body shaming, guilt, identity-based insults, or “earning” food.

Examples:

- Empty journal: “Something good on your plate? Start here.”
- First log: “One little log. A good place to start.”
- Welcome back: “Your plate called. It missed you.”
- Momo: “I brought emotional support. And a very small calculator.”
- Error: “That didn’t save. Try again—your entry is still here.”

## Implementation and exports

Source of truth for the artwork: `web/app/src/brand/identity.json`.
Reusable web component: `web/app/src/components/BrandLogo.tsx`.
Shared color palette: `web/app/src/styles/tokens.css`. Logo and screen integration: `web/app/src/styles/poiem-brand.css`.
Public visual kit: `web/app/public/brand/index.html` (local `/brand/index.html`; production `/app/brand/index.html`).
Vector exports include ink/light/monochrome wordmarks, the stamp, app icon, and social card. PNGs include 180/192/512/1024 px app icons and the 1200×630 sharing card. Native Expo exports live in `mobile/assets/poiem/`.

Regenerate assets from `web/app` with `node scripts/build-brand-assets.mjs`. Chromium from the existing Playwright installation is required. Generated artwork has no external font or image dependency.

## Launch checklist — external setup is not completed by a code rename

- Verify control of `poiem.app`, attach it to the Vercel project, configure DNS and HTTPS.
- Keep `/app/` routing until a separate routing migration is tested. The brand assets have explicit deployment rewrites.
- Add the new origin and redirect URIs to Google OAuth; update authorized production `APP_ORIGIN` / `ALLOWED_ORIGINS` configuration. Keep the previous domain working during the transition.
- Set and verify a Poiem display name/sender in the mail provider. Do not invent an unverified `@poiem.app` support or sender address.
- Social metadata targets `https://poiem.app/app/brand/poiem-social.png`; previews depend on the domain being connected.
- Test sign-in, password reset, export/import, and local-to-cloud claim on the new origin. Browser storage is origin-scoped: a custom-domain move does not automatically transfer local-only journals. Offer export/import or account sync before redirecting the old origin.
- Rebuild the Expo app to publish its new display name/icons. Store listings and OAuth consent-screen branding require separate provider-console changes.
- The original upstream native Swift/Kotlin projects, marketing site and historical release docs are retained as provenance, not relabelled as Poiem releases. Do not publish their old screenshots/store listings under Poiem without a separate native release review.
- Package scopes, database/storage keys, JWT audiences/issuers, Expo project IDs, native bundle IDs, URL schemes, licenses, and upstream attribution intentionally remain unchanged. This is a brand change, not an account/data migration.

No domain purchase, trademark clearance, provider-console change, deployment, or store release is implied by this kit.
