# Play Store Listing

Google Play Console listing copy for Fud AI Android (current: v2.3.0 / versionCode 26). Each field is in a code block for easy copy-paste. Char counts are tracked because Play Console enforces hard caps and silently truncates anything over.

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

NEW in v2.3.0: Recalculate Goals is now AI-powered — calories and macros come from your profile plus your logged intake and weight trend (your own provider key; standard formula offline). Onboarding now sets up your AI and builds your starting plan with it.

Open source, privacy-first. Bring your own API key.

HOW TO USE
1) Set up your profile with goals + body stats
2) Snap, scan, speak, type, or manually enter a meal — review/edit nutrition, preview What if?, and save
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
• Voice — 6 STT engines with language selection
• Text — describe in plain language, AI parses it
• Manual Entry — name + calories + macros + meal type
• Saved Meals — re-log recents, frequent meals, and favorites
• Copy from Day — copy meals from another date

BODY COMPOSITION TRACKING
Log body fat %, set a goal %, and see it alongside weight on Progress. Health Connect can auto-import compatible samples.

13 AI PROVIDERS
Google Gemini, OpenAI, Claude, xAI Grok, Groq, OpenRouter, Together, Hugging Face, Fireworks, DeepInfra, Mistral, Ollama, or any OpenAI-compatible endpoint. Switch anytime. Keys are stored encrypted.

6 SPEECH-TO-TEXT ENGINES
Native Android, Gemini, OpenAI Whisper, Groq, Deepgram, AssemblyAI. Choose Provider Auto, Use Device Language, or a fixed language.

COACH
Multi-turn chat sees your profile, weight, body fat, and food log. Ask "what was my weight in March?" or "how's my protein this week?" — Coach pulls the date range it needs. You can attach a camera or photo-library image.

REVIEW BEFORE LOGGING
Unlock Nutrition to correct calories, macros, and detailed nutrients before saving; serving changes then scale from your edits. What if? previews today's macro impact and can ask AI for a suggestion.

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

NOTE: Not medical advice. Estimates are AI-generated; consult a healthcare professional before significant diet changes.

Terms: https://fud-ai.app/terms.html
Privacy: https://fud-ai.app/privacy.html
Source: https://github.com/apoorvdarshan/fud-ai

```

### Other 14 languages
English-only on Play Console — non-English Play Store browsers (ar, az-AZ, de-DE, es-ES, fr-FR, hi-IN, it-IT, ja-JP, ko-KR, nl-NL, pt-BR, ro, ru-RU, zh-CN) see the English source as fallback. The in-app UI itself is fully translated into all 14 locales via per-locale `values-{lang}/strings.xml`, so the localization gap is only on the Play Store listing surface, not inside the app.

---

## 4. What's New (v2.3.0 / versionCode 26)

**500 char hard cap per language.** Paste the entire block below into Play Console's "Release notes" field — it auto-routes each `<lang-tag>` block to the matching locale.

```
<en-US>
• Recalculate Goals is now AI-powered — it sets your calories and macros from your profile and refines them from your logged intake and weight trend. Falls back to the standard formula offline.
• Onboarding now sets up your AI provider and key, then builds your starting plan with AI.
</en-US>

<ar>
• أصبحت ميزة "إعادة حساب الأهداف" مدعومة بالذكاء الاصطناعي الآن — تحدد سعراتك الحرارية وعناصرك الغذائية من ملفك الشخصي وتحسّنها بناءً على ما سجّلته من طعام واتجاه وزنك. وتعود إلى المعادلة القياسية عند عدم الاتصال.
• يقوم الإعداد الأولي الآن بتهيئة مزوّد الذكاء الاصطناعي والمفتاح، ثم يبني خطتك الأولية بالذكاء الاصطناعي.
</ar>

<az-AZ>
• Məqsədləri Yenidən Hesabla artıq süni intellektlə işləyir — profilinizə əsasən kalori və makroları təyin edir, qeyd etdiyiniz qida və çəki tendensiyasına görə dəqiqləşdirir. Oflayn rejimdə standart düstura keçir.
• Tanışlıq mərhələsi indi süni intellekt provayderini və açarını qurur, sonra başlanğıc planınızı süni intellektlə formalaşdırır.
</az-AZ>

<de-DE>
• "Ziele neu berechnen" wird jetzt von KI gesteuert: Es legt Kalorien und Makros aus deinem Profil fest und verfeinert sie anhand deiner erfassten Aufnahme und deines Gewichtstrends. Offline gilt die Standardformel.
• Das Onboarding richtet jetzt deinen KI-Anbieter und Schlüssel ein und erstellt dann deinen Startplan mit KI.
</de-DE>

<es-ES>
• Recalcular objetivos ahora funciona con IA: establece tus calorías y macros a partir de tu perfil y los ajusta según tu consumo registrado y tu tendencia de peso. Si estás sin conexión, usa la fórmula estándar.
• La configuración inicial ahora prepara tu proveedor de IA y tu clave, y luego crea tu plan inicial con IA.
</es-ES>

<fr-FR>
• Le recalcul des objectifs est désormais propulsé par l'IA : il définit vos calories et macros à partir de votre profil, puis les ajuste selon vos apports enregistrés et l'évolution de votre poids. Bascule sur la formule standard hors ligne.
• L'intégration configure maintenant votre fournisseur d'IA et votre clé, puis crée votre plan de départ avec l'IA.
</fr-FR>

<hi-IN>
• Recalculate Goals अब AI-संचालित है — यह आपकी प्रोफ़ाइल से कैलोरी और मैक्रो तय करता है और आपके दर्ज सेवन व वज़न रुझान से उन्हें बेहतर बनाता है। ऑफ़लाइन होने पर मानक फ़ॉर्मूले पर लौट जाता है।
• ऑनबोर्डिंग अब आपका AI प्रोवाइडर और key सेट करती है, फिर AI से आपकी शुरुआती योजना बनाती है।
</hi-IN>

<it-IT>
• Ricalcola obiettivi ora è basato sull'AI: imposta calorie e macro dal tuo profilo e li perfeziona in base al cibo registrato e all'andamento del peso. Offline usa la formula standard.
• L'onboarding ora configura il provider AI e la chiave, poi crea il tuo piano iniziale con l'AI.
</it-IT>

<ja-JP>
• 「目標を再計算」がAI対応になりました。プロフィールからカロリーとマクロを設定し、記録した摂取量と体重の推移をもとに最適化します。オフライン時は標準の計算式に切り替わります。
• オンボーディングでAIプロバイダーとキーを設定し、AIが最初のプランを作成するようになりました。
</ja-JP>

<ko-KR>
• 목표 재계산 기능이 이제 AI로 작동합니다. 프로필을 기반으로 칼로리와 영양소를 설정하고, 기록한 섭취량과 체중 추세를 반영해 더 정확하게 조정합니다. 오프라인에서는 기본 공식으로 전환됩니다.
• 온보딩에서 이제 AI 제공업체와 키를 설정한 뒤, AI로 시작 플랜을 만들어 줍니다.
</ko-KR>

<nl-NL>
• Doelen herberekenen werkt nu met AI: het stelt je calorieën en macro's in op basis van je profiel en verfijnt ze aan de hand van je geregistreerde inname en gewichtstrend. Offline valt het terug op de standaardformule.
• Bij het instellen worden nu je AI-provider en -sleutel geconfigureerd, waarna AI je startplan opbouwt.
</nl-NL>

<pt-BR>
• O Recalcular Metas agora usa IA — define suas calorias e macros a partir do seu perfil e os ajusta com base no consumo registrado e na tendência de peso. Sem internet, volta para a fórmula padrão.
• A introdução agora configura seu provedor de IA e sua chave e, em seguida, cria seu plano inicial com IA.
</pt-BR>

<ro>
• Recalcularea obiectivelor folosește acum AI — îți stabilește caloriile și macronutrienții din profil și le ajustează în funcție de aportul înregistrat și de evoluția greutății. Offline revine la formula standard.
• Configurarea inițială îți setează acum furnizorul AI și cheia, apoi creează planul de început cu AI.
</ro>

<ru-RU>
• Пересчёт целей теперь работает на ИИ — он задаёт калории и макросы по вашему профилю и уточняет их по записанному рациону и динамике веса. Без сети используется стандартная формула.
• Онбординг теперь настраивает ИИ-провайдера и ключ, а затем строит ваш стартовый план с помощью ИИ.
</ru-RU>

<zh-CN>
• “重新计算目标”现已由 AI 驱动——它会根据你的个人资料设定卡路里和宏量营养素，并依据你记录的摄入量和体重趋势进行优化。离线时回退到标准公式。
• 引导设置现可配置你的 AI 服务商和密钥，然后用 AI 为你生成初始计划。
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
