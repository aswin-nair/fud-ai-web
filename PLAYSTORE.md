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

NEW in v2.2: Energy Burn Goals now refresh automatically once per day, Adaptive Goals (Experimental) can make a small weekly calorie correction, and Activity Level shows clearer protein targets including lean-mass equivalents when body fat is set.

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
BMR via Katch-McArdle or Mifflin-St Jeor. TDEE with 6 activity levels. Auto-calculated calorie + protein + carbs + fat targets — fully customizable. Activity Level shows protein in g/kg body weight, or the equivalent lean-mass multiplier when body fat is set.

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
• Energy Burn Goals auto-refresh once per day on open.
• Uses recent completed Health Connect burn data from 14 days.
• Adaptive Goals (Experimental) can add a weekly trend correction.
• Activity Level shows protein g/kg; body-fat entries switch it to lean-mass equivalent.
• Calories and macros stay editable without resetting logs.
</en-US>

<ar>
• يتم تحديث Energy Burn Goals تلقائيًا مرة يوميًا عند فتح Fud AI.
• يستخدم بيانات حرق الطاقة المكتملة من Health Connect لآخر 14 يومًا.
• يمكن لـ Adaptive Goals (تجريبي) إضافة تصحيح أسبوعي للاتجاه.
• يعرض Activity Level البروتين g/kg؛ ومع دهون الجسم يتحول لمكافئ الكتلة الخالية من الدهون.
• تبقى السعرات والماكروز قابلة للتعديل دون تصفير السجلات.
</ar>

<az-AZ>
• Energy Burn Goals Fud AI açıldıqda gündə bir dəfə avtomatik yenilənir.
• Son 14 günün tamamlanmış Health Connect enerji sərfiyyatı məlumatından istifadə edir.
• Adaptive Goals (Eksperimental) həftəlik trend düzəlişi əlavə edə bilər.
• Activity Level protein g/kg göstərir; bədən yağı varsa yağsız kütlə ekvivalentinə keçir.
• Kalorilər və makrolar logları sıfırlamadan redaktə qalır.
</az-AZ>

<de-DE>
• Energy Burn Goals aktualisiert sich einmal täglich beim Öffnen.
• Nutzt abgeschlossene Health-Connect-Energiedaten der letzten 14 Tage.
• Adaptive Goals (Experimental) kann eine wöchentliche Trendkorrektur hinzufügen.
• Aktivitätslevel zeigt Protein g/kg; mit Körperfett als Magermasse-Äquivalent.
• Kalorien und Makros bleiben ohne Log-Reset editierbar.
</de-DE>

<es-ES>
• Energy Burn Goals se actualiza una vez al día al abrir Fud AI.
• Usa datos completados de energía de Health Connect de los últimos 14 días.
• Adaptive Goals (Experimental) puede añadir una corrección semanal de tendencia.
• Nivel de actividad muestra proteína g/kg; con grasa corporal pasa a equivalente de masa magra.
• Calorías y macros siguen editables sin borrar registros.
</es-ES>

<fr-FR>
• Energy Burn Goals s'actualise une fois par jour à l'ouverture.
• Utilise les données d'énergie Health Connect terminées des 14 derniers jours.
• Adaptive Goals (Experimental) peut ajouter une correction hebdomadaire de tendance.
• Niveau d'activité affiche les protéines g/kg; avec graisse corporelle, équivalent masse maigre.
• Calories et macros restent modifiables sans réinitialiser les journaux.
</fr-FR>

<hi-IN>
• Energy Burn Goals Fud AI खोलने पर दिन में एक बार auto-refresh होता है.
• पिछले 14 दिनों के completed Health Connect burn data का उपयोग करता है.
• Adaptive Goals (Experimental) weekly trend correction जोड़ सकता है.
• Activity Level protein g/kg दिखाता है; body fat होने पर lean-mass equivalent दिखता है.
• Calories और macros editable रहते हैं, logs reset नहीं होते.
</hi-IN>

<it-IT>
• Energy Burn Goals si aggiorna una volta al giorno all'apertura.
• Usa i dati Health Connect completati degli ultimi 14 giorni.
• Adaptive Goals (Experimental) può aggiungere una correzione settimanale del trend.
• Livello attività mostra proteine g/kg; con grasso corporeo passa all'equivalente massa magra.
• Calorie e macro restano modificabili senza azzerare i log.
</it-IT>

<ja-JP>
• Energy Burn Goalsは起動時に1日1回自動更新されます。
• 過去14日間の完了済みHealth Connect消費データを使用します。
• Adaptive Goals（Experimental）は週次トレンド補正を追加できます。
• Activity Levelにたんぱく質g/kgを表示。体脂肪がある場合は除脂肪量換算に切替。
• カロリーとマクロはログをリセットせず編集できます。
</ja-JP>

<ko-KR>
• Energy Burn Goals는 열 때 하루 한 번 자동 새로고침됩니다.
• 최근 14일의 완료된 Health Connect 에너지 소모 데이터를 사용합니다.
• Adaptive Goals(Experimental)는 주간 추세 보정을 추가할 수 있습니다.
• Activity Level에 단백질 g/kg 표시; 체지방 입력 시 제지방량 환산으로 전환.
• 칼로리와 매크로는 로그 초기화 없이 편집 가능합니다.
</ko-KR>

<nl-NL>
• Energy Burn Goals vernieuwt een keer per dag bij openen.
• Gebruikt voltooide Health Connect-energiegegevens van de laatste 14 dagen.
• Adaptive Goals (Experimental) kan een wekelijkse trendcorrectie toevoegen.
• Activiteitsniveau toont eiwit g/kg; met lichaamsvet als vetvrije-massa-equivalent.
• Calorieën en macro's blijven bewerkbaar zonder logs te resetten.
</nl-NL>

<pt-BR>
• Energy Burn Goals atualiza uma vez por dia ao abrir.
• Usa dados concluídos de energia do Health Connect dos últimos 14 dias.
• Adaptive Goals (Experimental) pode adicionar correção semanal de tendência.
• Nível de atividade mostra proteína g/kg; com gordura corporal vira equivalente de massa magra.
• Calorias e macros continuam editáveis sem zerar registros.
</pt-BR>

<ro>
• Energy Burn Goals se actualizează o dată pe zi la deschidere.
• Folosește date Health Connect finalizate din ultimele 14 zile.
• Adaptive Goals (Experimental) poate adăuga o corecție săptămânală de trend.
• Nivelul de activitate arată proteine g/kg; cu grăsime corporală trece la echivalent masă slabă.
• Caloriile și macrourile rămân editabile fără resetarea jurnalelor.
</ro>

<ru-RU>
• Energy Burn Goals обновляется раз в день при открытии.
• Берет завершенные данные Health Connect за последние 14 дней.
• Adaptive Goals (Experimental) может добавить недельную коррекцию тренда.
• Activity Level показывает белок g/kg; при % жира — эквивалент по сухой массе.
• Калории и макросы редактируются без сброса журналов.
</ru-RU>

<zh-CN>
• Energy Burn Goals 打开时每天自动刷新一次。
• 使用最近 14 天已完成的 Health Connect 能量消耗数据。
• Adaptive Goals（Experimental）可加入每周趋势校正。
• Activity Level 显示蛋白质 g/kg；有体脂时切换为瘦体重等效值。
• 热量和宏量营养可编辑，不会重置日志。
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
