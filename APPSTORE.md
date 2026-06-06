# App Store Listing

App Store Connect submission details for Fud AI v4.3 build 24. Each field is in a code block for easy copy-paste.

## App Name
```
Fud AI - Calorie Tracker
```

## Subtitle (30 chars max)
```
Food & Macro Tracker
```

## Promotional Text (170 chars max)
```
Food-description analysis can fall back to Apple Intelligence on supported iPhones after Premium/BYOK provider attempts fail.
```

## Keywords (100 chars max)
```
calorie,tracker,nutrition,macro,AI,food,scanner,diet,protein,weight,bodyfat,health,fitness,meal,log
```

## Category
```
Primary: Health & Fitness
Secondary: Food & Drink
```

## What's New (v4.3)
```
Fud AI 4.3 — Apple Intelligence fallback and Polish localization fixes.

NEW
• Text, voice-transcribed, and Siri food logging now try the active AI access path first: Premium Gemini, or your BYOK provider plus configured fallback.
• On supported iPhones, Apple Intelligence can run as a final on-device fallback when those provider attempts fail.
• Apple Intelligence fallback keeps the existing serving-unit review behavior and skips unsupported scripts.
• Photo scans, nutrition label scans, and Coach continue using the configured AI access path.
• Polish now covers dynamic nutrient names, meal types, Settings labels, and locale-aware date/time display.
• Polish "Log" wording has been corrected to "Dodaj" / "Dodaj wagę" where appropriate.

No data migration is required. Existing logs, goals, widgets, Premium, and BYOK settings are preserved.
```

## Description
```
Effortless calorie tracking with AI-powered food recognition. Snap, scan, speak, or type a meal — get instant calories, macros, and nutrients.

NEW in v4.3: Text, voice-transcribed, and Siri food logging now try the active AI access path first: Premium Gemini, or your BYOK provider plus configured fallback. On supported iPhones, Apple Intelligence can run as a final on-device fallback when those provider attempts fail. Build 24 also improves Polish localization for dynamic nutrients, meal types, Settings labels, and locale-aware date/time display.

Free, open source, privacy-first. Bring your own API key, or use optional Fud AI Premium for hosted Gemini + Deepgram access. Premium hides BYOK controls until you switch back.

HOW TO USE
1) Set your profile and goals
2) Snap, scan, speak, type, or manually enter a meal — review/edit nutrition, preview What if?, and save.
3) Ask Coach for trends, predictions, and advice
4) Track progress on charts and widgets

LOG MEALS
Photo, Photo + Note, Photo + Photo, Nutrition Label, Barcode, From Photos, Voice, Text, Manual Entry, Saved Meals, and iOS Siri shortcuts for food, weight, and today's calories.

AI ACCESS
Bring Your Own Key supports Gemini, OpenAI, Claude, Grok, Groq, OpenRouter, Together AI, Hugging Face, Fireworks AI, DeepInfra, Mistral, Ollama, or any OpenAI-compatible endpoint. Keys stay in iOS Keychain. Premium provides no-key Gemini + Deepgram access.

6 SPEECH-TO-TEXT OPTIONS
Native iOS, Gemini Audio, OpenAI Whisper, Groq, Deepgram, and AssemblyAI, with Provider Auto, iPhone Language, or a specific language where supported.

REVIEW BEFORE LOGGING
Unlock Nutrition to correct calories, macros, and detailed nutrients. What if? previews daily macro impact before saving.

COACH
Multi-turn chat with on-demand access to your profile, targets, forecast, and food log. Ask any date range — "what did I eat Tuesday?"

EXPANDED NUTRIENTS
Calories, protein, carbs, fat, sugar, fiber, saturated/trans fats, cholesterol, sodium, potassium, calcium, iron, magnesium, zinc, vitamins A/C/D/E/K/B12, folate, omega-3 when available.

PERSONALIZED GOALS
BMR via Katch-McArdle or Mifflin-St Jeor, TDEE with 6 activity levels, auto-calculated macros, Activity Level protein targets, optional nutrient goals, and Experimental Adaptive Goals.

PROGRESS
Weight / Body Fat chart, average and net change summaries, goal lines, calorie trend vs goal, and macro averages.

WIDGETS
iOS widgets cover Home Screen Small, Medium, and Large, a small-only Protein widget, and Lock Screen widgets. Apple Watch app and complications show calories and macros at a glance.

16 LANGUAGES
English, Spanish, French, German, Italian, Portuguese (BR), Dutch, Russian, Polish, Japanese, Korean, Chinese (Simplified), Hindi, Arabic, Romanian, Azerbaijani.

PRIVACY
No account, sign-in, cloud sync, analytics, ads, or tracking. BYOK keys stay on-device. Premium requests go through Fud AI's proxy only for the request being processed. Supported iPhones can use Apple Intelligence on-device as a final fallback for text, voice-transcribed, and Siri food-description analysis. Review edits are saved only if you log the meal. Barcode sends only the barcode to Open Food Facts. MIT licensed.

APPLE HEALTH
Two-way sync for nutrition, weight, height, and body fat. External samples can auto-import. Experimental Energy Burn Goals can use active/total energy while keeping macros editable.

Fud AI is not medical advice — consult a healthcare professional before significant diet changes.

Terms: https://fud-ai.app/terms.html
Privacy: https://fud-ai.app/privacy.html
Source: https://github.com/apoorvdarshan/fud-ai

```

## Privacy URL
```
https://fud-ai.app/privacy.html
```

## Terms URL
```
https://fud-ai.app/terms.html
```

## Support URL
```
https://fud-ai.app
```

## Marketing URL
```
https://fud-ai.app
```

## Reviewer Notes
```
1) iPhone only — not optimized for iPad. Please review on iPhone.
2) No test account is needed. The app works immediately after onboarding.
3) Fud AI has two AI Access modes:
   • Bring Your Own Key (free): users enter their own provider API key.
   • Fud AI Premium (optional subscription): no-key AI access through Fud AI's Gemini + Deepgram proxy.
4) Premium subscription products:
   • fudai.premium.weekly — $6.99/week
   • fudai.premium.yearly — $199.99/year
5) Premium review path: during onboarding choose Fud AI Premium, or after onboarding go to Settings → AI Access → Fud AI Premium. The paywall uses RevenueCat and falls back to StoreKit products if RevenueCat offerings are unavailable, so App Store sandbox purchase testing should be available.
6) BYOK review path: go to Settings → AI Access → Bring Your Own Key → enter any valid Gemini API key. A free key can be obtained at https://aistudio.google.com/apikey
7) Premium mode hides BYOK provider, fallback, and speech API key controls to avoid conflicting settings. Switching back to Bring Your Own Key restores those controls and does not delete saved BYOK settings.
8) v4.3 adds Apple Intelligence as a final on-device fallback for text, voice-transcribed, and Siri food-description analysis on supported iPhones only after Premium Gemini or BYOK provider/fallback attempts fail. Photo scans, Nutrition Label, Coach, and speech transcription still use the configured AI access path.
9) Build 24 keeps the marketing version at 4.3 and fixes issue #80 follow-up Polish localization gaps: dynamic nutrients, meal types, Settings labels, "Log" wording, and locale-aware date/time formatting.
```
