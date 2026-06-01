# Play Store Listing

Google Play Console listing copy for Fud AI Android (current: v2.2 / versionCode 23). Each field is in a code block for easy copy-paste. Char counts are tracked because Play Console enforces hard caps and silently truncates anything over.

**Where to paste each field in Play Console:**
- App name / Short description / Full description → Grow → Store presence → **Main store listing** (default English) and Grow → Store presence → **Custom store listings** → Manage translations (per-language overrides)
- What's new → **Releases → Production / Closed testing → Create new release → Release notes** field (paste the entire `<lang-tag>` block; Play Console parses tags automatically)

---

## 1. App Name

**30 char hard cap per language.** Brand name stays as `Fud AI` untranslated; the descriptor after the dash is what gets localized. English-only on Play Console — non-English Play Store browsers see the English source as fallback.

### English (en-US) — 24 chars
```
Fud AI - Calorie Tracker
```

---

## 2. Short Description

**80 char hard cap per language. Cannot include price/promotion keywords ("free", "discount", "sale", "best", "#1", etc.) — Play Console will block promotion of the listing.** Live Play Store currently has "Snap, speak, or type a meal. AI logs the calories. Free & open source." which triggers the warning; replacement below drops "Free" while keeping the same rhythm. English-only on Play Console — non-English Play Store browsers see the English source as fallback.

### English (en-US) — 63 chars
```
Snap, speak, or type a meal. AI logs the calories. Open source.
```

---

## 3. Full Description

**4000 char hard cap per language.** This is the long-form "About this app" copy. English-only on Play Console — non-English Play Store browsers see the English source as fallback (deliberate decision; the in-app UI is fully translated via per-locale `values-{lang}/strings.xml` so users still get a localized experience once installed).

### English (en-US)
```
Fud AI makes calorie tracking effortless with AI-powered food recognition. Snap a photo, scan a barcode, speak it, or type it — get instant nutrition: calories, protein, carbs, fats, vitamins, minerals, and more.

NEW in v2.2: Energy Burn Goals now refresh automatically once per day, and Adaptive Goals (Experimental) can make a small weekly calorie correction from your weight trend while keeping pinned macros intact.

Free, open source, privacy-first. Bring your own API key. All data stays on your device.

HOW TO USE
1) Set up your profile with goals + body stats
2) Snap, scan, speak, type, or manually enter a meal — review and save
3) Ask Coach anything: trends, predictions, advice
4) Track progress on charts and home screen widgets

11 WAYS TO LOG A MEAL
• Photo — AI identifies food and returns nutrition
• Photo + Note — add context before AI analysis
• Photo + Photo — combine two images in one analysis
• Nutrition Label — scan package nutrition facts
• Barcode — look up packaged foods with Open Food Facts
• From Photos — analyze an existing image
• From Photos + Note — add context to a library photo
• Voice — 5 STT engines with language selection
• Text — describe in plain language, AI parses it
• Manual Entry — name + calories + macros + meal type
• Saved Meals — re-log recents, frequent meals, and favorites
• Copy from Day — copy meals from another date

BODY COMPOSITION TRACKING
Log body fat % over time, set a goal %, and see it alongside weight on the unified Progress chart. Health Connect can auto-import samples from compatible apps and scales.

13 AI PROVIDERS
Google Gemini, OpenAI, Anthropic Claude, xAI Grok, Groq, OpenRouter, Together AI, Hugging Face, Fireworks AI, DeepInfra, Mistral, Ollama, or any OpenAI-compatible endpoint. Switch anytime. Keys are stored encrypted.

6 SPEECH-TO-TEXT ENGINES
Native Android, Gemini, OpenAI Whisper, Groq, Deepgram, AssemblyAI. Choose Provider Auto, Use Device Language, or a fixed language.

COACH
Multi-turn chat that sees your profile, weight, body fat, and food log. Ask "what was my weight in March?" or "how's my protein this week?" — Coach pulls the date range it needs via on-demand tools. You can also attach a camera photo or photo-library image to a Coach message.

PERSONALIZED GOALS
BMR via Katch-McArdle or Mifflin-St Jeor. TDEE with 6 activity levels. Auto-calculated calorie + protein + carbs + fat targets — fully customizable.

OPTIONAL NUTRIENT GOALS
Set expanded nutrient goals separately from the macro calculator: fiber, sugar, fats, cholesterol, sodium, potassium, calcium, iron, magnesium, zinc, vitamins, folate, omega-3, and more when available. Use AI Estimate from your profile, or set goals manually. Home cards can show macros or selected detailed nutrients.

PROGRESS
Unified Weight / Body Fat chart with current, goal, net change, average, trend lines, and goal overlays. Calorie trend vs goal. Macro averages over 1W, 1M, 3M, 6M, 1Y, All Time.

WIDGETS
Calorie and nutrient widgets refresh when you log a meal.

15 LANGUAGES
Auto-selected by phone language: English, Spanish, French, German, Italian, Portuguese (BR), Dutch, Russian, Japanese, Korean, Chinese, Hindi, Arabic, Romanian, Azerbaijani.

PRIVACY FIRST
No account, no sign-in, no cloud sync, no analytics, no ads, no tracking. Local-only. MIT licensed.

HEALTH CONNECT
Sync nutrition, weight, and body fat with permission reconciliation and backfill support. Edits and deletes sync back where supported.

NOTE: Not medical advice. All nutritional estimates are AI-generated. Consult a healthcare professional before significant diet changes.

Terms: https://fud-ai.app/terms.html
Privacy: https://fud-ai.app/privacy.html
Source: https://github.com/apoorvdarshan/fud-ai

```

### Other 14 languages
English-only on Play Console — non-English Play Store browsers (ar, az-AZ, de-DE, es-ES, fr-FR, hi-IN, it-IT, ja-JP, ko-KR, nl-NL, pt-BR, ro, ru-RU, zh-CN) see the English source as fallback. The in-app UI itself is fully translated into all 14 locales via per-locale `values-{lang}/strings.xml`, so the localization gap is only on the Play Store listing surface, not inside the app.

---

## 4. What's New (v2.2 / versionCode 23)

**500 char hard cap per language.** Paste the entire block below into Play Console's "Release notes" field — it auto-routes each `<lang-tag>` block to the matching locale.

```
<en-US>
• Energy Burn Goals now refresh automatically once per day when you open Fud AI.
• Uses recent completed Health Connect energy burn data from the last 14 days.
• Adaptive Goals (Experimental) can make a small weekly weight-trend correction.
• Manual refresh remains available, and calories update without resetting logs.
• Protein, carbs, and fat stay editable/auto-balanced.
</en-US>

<ar>
• Energy Burn Goals يتم تحديثها تلقائيًا مرة يوميًا عند فتح Fud AI.
• يستخدم بيانات Health Connect المكتملة لحرق الطاقة من آخر 14 يومًا.
• يظل التحديث اليدوي متاحًا، وتتحدث السعرات دون حذف السجلات.
• البروتين والكارب والدهون تبقى قابلة للتعديل/الموازنة التلقائية.
</ar>

<az-AZ>
• Energy Burn Goals Fud AI açıldıqda gündə bir dəfə avtomatik yenilənir.
• Son 14 gündə tamamlanmış Health Connect enerji sərfiyyatı məlumatından istifadə edir.
• Manual yeniləmə qalır; kalorilər logları sıfırlamadan yenilənir.
• Protein, karbohidrat və yağ redaktə/avto-balans edilə qalır.
</az-AZ>

<de-DE>
• Energy Burn Goals aktualisiert sich einmal täglich automatisch beim Öffnen von Fud AI.
• Nutzt abgeschlossene Health-Connect-Energiedaten der letzten 14 Tage.
• Manuelles Aktualisieren bleibt möglich; Kalorien ändern sich ohne Log-Reset.
• Protein, Kohlenhydrate und Fett bleiben editierbar/auto-balanciert.
</de-DE>

<es-ES>
• Energy Burn Goals se actualiza automáticamente una vez al día al abrir Fud AI.
• Usa datos completados de energía quemada de Health Connect de los últimos 14 días.
• La actualización manual sigue disponible; las calorías cambian sin borrar registros.
• Proteína, carbohidratos y grasa siguen editables/con auto-balance.
</es-ES>

<fr-FR>
• Energy Burn Goals s'actualise automatiquement une fois par jour à l'ouverture de Fud AI.
• Utilise les données Health Connect terminées des 14 derniers jours.
• L'actualisation manuelle reste disponible; les calories changent sans réinitialiser les journaux.
• Protéines, glucides et lipides restent modifiables/auto-équilibrés.
</fr-FR>

<hi-IN>
• Energy Burn Goals अब Fud AI खोलने पर दिन में एक बार auto-refresh होता है.
• पिछले 14 दिनों के completed Health Connect energy burn data का उपयोग करता है.
• Manual refresh अभी भी उपलब्ध है; calories update होती हैं, logs reset नहीं होते.
• Protein, carbs और fat editable/auto-balanced रहते हैं.
</hi-IN>

<it-IT>
• Energy Burn Goals si aggiorna automaticamente una volta al giorno quando apri Fud AI.
• Usa i dati Health Connect completati degli ultimi 14 giorni.
• Il refresh manuale resta disponibile; le calorie cambiano senza azzerare i log.
• Proteine, carboidrati e grassi restano modificabili/auto-bilanciati.
</it-IT>

<ja-JP>
• Energy Burn GoalsはFud AIを開くと1日1回自動更新されます。
• 過去14日間の完了済みHealth Connect消費エネルギーデータを使用します。
• 手動更新も可能で、ログを消さずにカロリー目標を更新します。
• たんぱく質、炭水化物、脂質は編集/自動調整できます。
</ja-JP>

<ko-KR>
• Energy Burn Goals는 Fud AI를 열 때 하루 한 번 자동 새로고침됩니다.
• 최근 14일의 완료된 Health Connect 에너지 소모 데이터를 사용합니다.
• 수동 새로고침도 가능하며 로그를 초기화하지 않고 칼로리만 업데이트합니다.
• 단백질, 탄수화물, 지방은 계속 편집/자동 균형 조정됩니다.
</ko-KR>

<nl-NL>
• Energy Burn Goals vernieuwt automatisch een keer per dag wanneer je Fud AI opent.
• Gebruikt voltooide Health Connect-energiegegevens van de laatste 14 dagen.
• Handmatig vernieuwen blijft beschikbaar; calorieën wijzigen zonder logs te resetten.
• Eiwit, koolhydraten en vet blijven bewerkbaar/auto-gebalanceerd.
</nl-NL>

<pt-BR>
• Energy Burn Goals atualiza automaticamente uma vez por dia ao abrir o Fud AI.
• Usa dados concluídos de energia do Health Connect dos últimos 14 dias.
• A atualização manual continua disponível; calorias mudam sem zerar registros.
• Proteína, carboidratos e gordura continuam editáveis/auto-balanceados.
</pt-BR>

<ro>
• Energy Burn Goals se actualizează automat o dată pe zi când deschizi Fud AI.
• Folosește date Health Connect finalizate din ultimele 14 zile.
• Actualizarea manuală rămâne disponibilă; caloriile se schimbă fără resetarea jurnalelor.
• Proteinele, carbohidrații și grăsimile rămân editabile/auto-echilibrate.
</ro>

<ru-RU>
• Energy Burn Goals обновляется раз в день при открытии Fud AI.
• Берет завершенные данные Health Connect за последние 14 дней.
• Ручное обновление остается; журналы не сбрасываются.
• Белки, углеводы и жиры остаются редактируемыми/авто-балансом.
</ru-RU>

<zh-CN>
• Energy Burn Goals 现在会在打开 Fud AI 时每天自动刷新一次。
• 使用最近 14 天已完成的 Health Connect 能量消耗数据。
• 仍可手动刷新；热量目标更新不会重置日志。
• 蛋白质、碳水和脂肪仍可编辑/自动平衡。
</zh-CN>
```

---

## 5. Categorization

```
App category: Health & Fitness
Tags: Calorie tracker, Nutrition, AI, Food tracker
```

## 6. Contact details

```
Email: apoorv@fud-ai.app
Phone: (omit — optional, US-only enforcement)
Website: https://fud-ai.app
Privacy policy: https://fud-ai.app/privacy.html
```

## 7. App content declarations

These are one-time setup in Play Console → Policy → App content. Don't drift from these answers across submissions:

- **Privacy policy URL**: https://fud-ai.app/privacy.html
- **App access**: All functionality available without restrictions
- **Ads**: No
- **Content rating**: Everyone (E)
- **Target audience**: 13+
- **News app**: No
- **COVID-19 contact tracing**: No
- **Data safety**: All processing on-device. No data collected/shared. API keys stored in EncryptedSharedPreferences. Encryption in transit when calling AI provider APIs (HTTPS). User can request deletion via in-app "Delete All Data" — no server data exists.
- **Government app**: No
- **Financial features**: No
- **Health features**: Yes — fitness/nutrition tracking. Local-only.
