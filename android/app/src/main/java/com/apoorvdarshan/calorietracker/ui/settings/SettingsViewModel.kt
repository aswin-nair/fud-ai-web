package com.apoorvdarshan.calorietracker.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.apoorvdarshan.calorietracker.AppContainer
import com.apoorvdarshan.calorietracker.models.AIProvider
import com.apoorvdarshan.calorietracker.models.OptionalNutrientGoals
import com.apoorvdarshan.calorietracker.models.SpeechLanguage
import com.apoorvdarshan.calorietracker.models.SpeechProvider
import com.apoorvdarshan.calorietracker.models.UserProfile
import com.apoorvdarshan.calorietracker.models.WeightEntry
import com.apoorvdarshan.calorietracker.models.WeightGoal
import com.apoorvdarshan.calorietracker.services.AndroidAppIconManager
import com.apoorvdarshan.calorietracker.services.WeightAnalysisService
import com.apoorvdarshan.calorietracker.services.health.HealthConnectManager
import com.apoorvdarshan.calorietracker.ui.theme.AppThemeColor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

data class SettingsUiState(
    val selectedAI: AIProvider = AIProvider.GEMINI,
    val selectedModel: String = AIProvider.GEMINI.defaultModel,
    val selectedSpeech: SpeechProvider = SpeechProvider.NATIVE,
    val selectedSpeechLanguage: SpeechLanguage = SpeechLanguage.defaultFor(SpeechProvider.NATIVE),
    val useMetric: Boolean = true,
    val preferGramsByDefault: Boolean = false,
    val profile: UserProfile? = null,
    val notificationsEnabled: Boolean = false,
    val streakReminderEnabled: Boolean = false,
    val dailySummaryEnabled: Boolean = false,
    val weightReminderEnabled: Boolean = true,
    val bodyFatReminderEnabled: Boolean = true,
    val goalReachedNotificationsEnabled: Boolean = true,
    val healthConnectEnabled: Boolean = false,
    val healthEnergyGoalsEnabled: Boolean = false,
    val adaptiveGoalsEnabled: Boolean = false,
    val applyingHealthEnergyGoals: Boolean = false,
    val applyingAdaptiveGoals: Boolean = false,
    val recalculatingGoals: Boolean = false,
    val healthEnergyGoalAlertTitle: String? = null,
    val healthEnergyGoalAlertMessage: String? = null,
    val adaptiveGoalAlertTitle: String? = null,
    val adaptiveGoalAlertMessage: String? = null,
    val apiKeyMasked: String = "",
    val speechApiKeyMasked: String = "",
    val appearanceMode: String = "system",
    val appThemeColor: AppThemeColor = AppThemeColor.FUD_PINK,
    val weekStartsOnMonday: Boolean = false,
    val userContext: String = "",
    val fallbackEnabled: Boolean = false,
    val fallbackProvider: AIProvider = AIProvider.GEMINI,
    val fallbackModel: String = AIProvider.GEMINI.defaultModel,
    val fallbackApiKeyMasked: String = "",
    val optionalNutrientGoals: OptionalNutrientGoals = OptionalNutrientGoals.Default
)

class SettingsViewModel(val container: AppContainer) : ViewModel() {
    private val _ui = MutableStateFlow(SettingsUiState())
    val ui: StateFlow<SettingsUiState> = _ui.asStateFlow()

    init {
        viewModelScope.launch {
            container.prefs.optionalNutrientGoals.collect { goals ->
                _ui.value = _ui.value.copy(optionalNutrientGoals = goals)
            }
        }

        viewModelScope.launch {
            val provider = container.prefs.selectedAIProvider.first()
            val model = provider.supportedModelOrDefault(container.prefs.selectedAIModel.first())
            val speech = container.prefs.selectedSpeechProvider.first()
            val speechLanguage = container.prefs.selectedSpeechLanguage(speech).first()
            val useMetric = container.prefs.useMetric.first()
            val preferGramsByDefault = container.prefs.preferGramsByDefault.first()
            val notif = container.prefs.notificationsEnabled.first()
            val streakReminder = container.prefs.streakReminderEnabled.first()
            val dailySummary = container.prefs.dailySummaryEnabled.first()
            val weightReminder = container.prefs.weightReminderEnabled.first()
            val bodyFatReminder = container.prefs.bodyFatReminderEnabled.first()
            val goalReachedNotifications = container.prefs.goalReachedNotificationsEnabled.first()
            val hc = reconcileHealthConnectState()
            val profile = container.profileRepository.current()
            val energyGoals = container.prefs.healthEnergyGoalsEnabled.first() && hc
            val adaptiveGoals = container.prefs.adaptiveGoalsEnabled.first()
            val masked = maskKey(container.keyStore.apiKey(provider))
            val speechMasked = maskKey(container.keyStore.speechApiKey(speech))
            val appearance = container.prefs.appearanceMode.first()
            val appThemeColor = AppThemeColor.fromKey(container.prefs.appThemeColor.first())
            val weekMon = container.prefs.weekStartsOnMonday.first()
            val userContext = container.prefs.userContext.first()
            val fbEnabled = container.prefs.fallbackEnabled.first()
            val fbProvider = container.prefs.selectedFallbackProvider.first()
            val fbModel = fbProvider.supportedModelOrDefault(container.prefs.selectedFallbackModel.first())
            val fbMasked = maskKey(container.keyStore.apiKey(fbProvider))
            val optionalGoals = container.prefs.optionalNutrientGoals.first()
            _ui.value = SettingsUiState(
                selectedAI = provider,
                selectedModel = model,
                selectedSpeech = speech,
                selectedSpeechLanguage = speechLanguage,
                useMetric = useMetric,
                preferGramsByDefault = preferGramsByDefault,
                profile = profile,
                notificationsEnabled = notif,
                streakReminderEnabled = streakReminder,
                dailySummaryEnabled = dailySummary,
                weightReminderEnabled = weightReminder,
                bodyFatReminderEnabled = bodyFatReminder,
                goalReachedNotificationsEnabled = goalReachedNotifications,
                healthConnectEnabled = hc,
                healthEnergyGoalsEnabled = energyGoals,
                adaptiveGoalsEnabled = adaptiveGoals,
                apiKeyMasked = masked,
                speechApiKeyMasked = speechMasked,
                appearanceMode = appearance,
                appThemeColor = appThemeColor,
                weekStartsOnMonday = weekMon,
                userContext = userContext,
                fallbackEnabled = fbEnabled,
                fallbackProvider = fbProvider,
                fallbackModel = fbModel,
                fallbackApiKeyMasked = fbMasked,
                optionalNutrientGoals = optionalGoals
            )
        }
    }

    fun setOptionalNutrientGoals(goals: OptionalNutrientGoals) {
        viewModelScope.launch {
            container.prefs.setOptionalNutrientGoals(goals)
            _ui.value = _ui.value.copy(optionalNutrientGoals = goals)
        }
    }

    fun setUserContext(value: String) {
        viewModelScope.launch {
            container.prefs.setUserContext(value)
            _ui.value = _ui.value.copy(userContext = value.trim())
        }
    }

    fun setFallbackEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setFallbackEnabled(v)
            _ui.value = _ui.value.copy(fallbackEnabled = v)
        }
    }

    fun selectFallbackProvider(p: AIProvider) {
        viewModelScope.launch {
            container.prefs.setSelectedFallbackProvider(p)
            // Reset model to provider default if old model isn't in the new provider's list.
            val current = _ui.value.fallbackModel
            val newModel = p.supportedModelOrDefault(current)
            container.prefs.setSelectedFallbackModel(newModel)
            val masked = maskKey(container.keyStore.apiKey(p))
            _ui.value = _ui.value.copy(fallbackProvider = p, fallbackModel = newModel, fallbackApiKeyMasked = masked)
        }
    }

    fun selectFallbackModel(m: String) {
        viewModelScope.launch {
            val model = _ui.value.fallbackProvider.supportedModelOrDefault(m)
            container.prefs.setSelectedFallbackModel(model)
            _ui.value = _ui.value.copy(fallbackModel = model)
        }
    }

    fun setFallbackApiKey(raw: String) {
        viewModelScope.launch {
            val p = _ui.value.fallbackProvider
            container.keyStore.setApiKey(p, raw.takeIf { it.isNotBlank() })
            _ui.value = _ui.value.copy(fallbackApiKeyMasked = maskKey(raw.takeIf { it.isNotBlank() }))
        }
    }

    fun setAppearanceMode(mode: String) {
        viewModelScope.launch {
            container.prefs.setAppearanceMode(mode)
            _ui.value = _ui.value.copy(appearanceMode = mode)
        }
    }

    fun setAppThemeColor(themeColor: AppThemeColor) {
        viewModelScope.launch {
            container.prefs.setAppThemeColor(themeColor.key)
            AndroidAppIconManager.apply(container.appContext, themeColor)
            _ui.value = _ui.value.copy(appThemeColor = themeColor)
        }
    }

    fun setWeekStartsOnMonday(monday: Boolean) {
        viewModelScope.launch {
            container.prefs.setWeekStartsOnMonday(monday)
            _ui.value = _ui.value.copy(weekStartsOnMonday = monday)
        }
    }

    fun selectProvider(p: AIProvider) {
        viewModelScope.launch {
            container.prefs.setSelectedAIProvider(p)
            container.prefs.setSelectedAIModel(p.defaultModel)
            val masked = maskKey(container.keyStore.apiKey(p))
            _ui.value = _ui.value.copy(selectedAI = p, selectedModel = p.defaultModel, apiKeyMasked = masked)
        }
    }

    fun selectModel(m: String) {
        viewModelScope.launch {
            val model = _ui.value.selectedAI.supportedModelOrDefault(m)
            container.prefs.setSelectedAIModel(model)
            _ui.value = _ui.value.copy(selectedModel = model)
        }
    }

    fun setApiKey(raw: String) {
        viewModelScope.launch {
            val p = _ui.value.selectedAI
            container.keyStore.setApiKey(p, raw.takeIf { it.isNotBlank() })
            _ui.value = _ui.value.copy(apiKeyMasked = maskKey(raw.takeIf { it.isNotBlank() }))
        }
    }

    fun selectSpeech(p: SpeechProvider) {
        viewModelScope.launch {
            container.prefs.setSelectedSpeechProvider(p)
            // Re-pull the masked key for the new provider so the API Key row
            // reflects whether the freshly selected provider has a key saved.
            val masked = maskKey(container.keyStore.speechApiKey(p))
            val language = container.prefs.selectedSpeechLanguage(p).first()
            _ui.value = _ui.value.copy(
                selectedSpeech = p,
                selectedSpeechLanguage = language,
                speechApiKeyMasked = masked
            )
        }
    }

    fun selectSpeechLanguage(language: SpeechLanguage) {
        viewModelScope.launch {
            val provider = _ui.value.selectedSpeech
            container.prefs.setSelectedSpeechLanguage(provider, language)
            _ui.value = _ui.value.copy(selectedSpeechLanguage = language)
        }
    }

    fun setSpeechApiKey(raw: String) {
        viewModelScope.launch {
            val p = _ui.value.selectedSpeech
            container.keyStore.setSpeechApiKey(p, raw.takeIf { it.isNotBlank() })
            _ui.value = _ui.value.copy(speechApiKeyMasked = maskKey(raw.takeIf { it.isNotBlank() }))
        }
    }

    fun setUseMetric(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setUseMetric(v)
            _ui.value = _ui.value.copy(useMetric = v)
        }
    }

    fun setPreferGramsByDefault(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setPreferGramsByDefault(v)
            _ui.value = _ui.value.copy(preferGramsByDefault = v)
        }
    }

    fun setNotificationsEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setNotificationsEnabled(v)
            syncNotificationSchedules()
            _ui.value = _ui.value.copy(notificationsEnabled = v)
        }
    }

    fun setStreakReminderEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setStreakReminderEnabled(v)
            syncNotificationSchedules()
            _ui.value = _ui.value.copy(streakReminderEnabled = v)
        }
    }

    fun setDailySummaryEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setDailySummaryEnabled(v)
            syncNotificationSchedules()
            _ui.value = _ui.value.copy(dailySummaryEnabled = v)
        }
    }

    fun setWeightReminderEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setWeightReminderEnabled(v)
            syncNotificationSchedules()
            _ui.value = _ui.value.copy(weightReminderEnabled = v)
        }
    }

    fun setBodyFatReminderEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setBodyFatReminderEnabled(v)
            syncNotificationSchedules()
            _ui.value = _ui.value.copy(bodyFatReminderEnabled = v)
        }
    }

    fun setGoalReachedNotificationsEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setGoalReachedNotificationsEnabled(v)
            _ui.value = _ui.value.copy(goalReachedNotificationsEnabled = v)
        }
    }

    private suspend fun syncNotificationSchedules() {
        val enabled = container.prefs.notificationsEnabled.first()
        if (!enabled || !container.notifications.canPostNotifications()) {
            container.notifications.cancelStreakReminder()
            container.notifications.cancelDailySummary()
            container.notifications.cancelWeightReminder()
            container.notifications.cancelBodyFatReminder()
            return
        }

        if (container.prefs.streakReminderEnabled.first()) {
            container.notifications.scheduleStreakReminder(
                container.prefs.streakReminderHour.first(),
                container.prefs.streakReminderMinute.first()
            )
        } else {
            container.notifications.cancelStreakReminder()
        }

        if (container.prefs.dailySummaryEnabled.first()) {
            container.notifications.scheduleDailySummary(
                container.prefs.dailySummaryHour.first(),
                container.prefs.dailySummaryMinute.first()
            )
        } else {
            container.notifications.cancelDailySummary()
        }

        if (container.prefs.weightReminderEnabled.first()) {
            container.notifications.scheduleWeightReminder()
        } else {
            container.notifications.cancelWeightReminder()
        }

        val profile = container.profileRepository.current()
        if (container.prefs.bodyFatReminderEnabled.first() && profile?.bodyFatPercentage != null) {
            container.notifications.scheduleBodyFatReminder()
        } else {
            container.notifications.cancelBodyFatReminder()
        }
    }

    fun setHealthConnectEnabled(v: Boolean) {
        viewModelScope.launch {
            if (!v) {
                val restored = if (container.prefs.healthEnergyGoalsEnabled.first()) {
                    container.profileRepository.current()
                        ?.let { container.prefs.restoreHealthEnergyGoalPreviousTargets(it) }
                } else {
                    null
                }
                if (restored != null) {
                    container.profileRepository.save(restored)
                    container.prefs.clearHealthEnergyGoalPreviousTargets()
                }
                container.prefs.setHealthConnectEnabled(false)
                container.prefs.setHealthEnergyGoalsEnabled(false)
                _ui.value = _ui.value.copy(
                    profile = restored ?: _ui.value.profile,
                    healthConnectEnabled = false,
                    healthEnergyGoalsEnabled = false
                )
                return@launch
            }

            val enabled = container.health.isAvailable() && container.health.hasAllPermissions()
            container.prefs.setHealthConnectEnabled(enabled)
            if (enabled) {
                backfillHealthConnect()
                container.prefs.setHealthPermissionsVersion(HealthConnectManager.CURRENT_TYPES_VERSION)
            }
            if (!enabled) container.prefs.setHealthEnergyGoalsEnabled(false)
            _ui.value = _ui.value.copy(
                healthConnectEnabled = enabled,
                healthEnergyGoalsEnabled = if (enabled) _ui.value.healthEnergyGoalsEnabled else false
            )
        }
    }

    private suspend fun reconcileHealthConnectState(): Boolean {
        if (!container.health.isAvailable()) {
            container.prefs.setHealthConnectEnabled(false)
            return false
        }

        val granted = container.health.hasAllPermissions()
        val stored = container.prefs.healthConnectEnabled.first()
        val version = container.prefs.healthPermissionsVersion.first()
        container.prefs.setHealthConnectEnabled(granted)
        if (!granted) {
            if (container.prefs.healthEnergyGoalsEnabled.first()) {
                container.profileRepository.current()?.let { current ->
                    val restored = container.prefs.restoreHealthEnergyGoalPreviousTargets(current)
                    container.profileRepository.save(restored)
                }
                container.prefs.clearHealthEnergyGoalPreviousTargets()
            }
            container.prefs.setHealthEnergyGoalsEnabled(false)
        }

        if (granted && (!stored || version < HealthConnectManager.CURRENT_TYPES_VERSION)) {
            backfillHealthConnect()
            container.prefs.setHealthPermissionsVersion(HealthConnectManager.CURRENT_TYPES_VERSION)
        }

        return granted
    }

    fun setHealthEnergyGoalsEnabled(v: Boolean) {
        viewModelScope.launch {
            if (!v) {
                val current = container.profileRepository.current()
                val restored = current?.let { container.prefs.restoreHealthEnergyGoalPreviousTargets(it) }
                if (restored != null) {
                    container.profileRepository.save(restored)
                }
                container.prefs.clearHealthEnergyGoalPreviousTargets()
                container.prefs.setHealthEnergyGoalsEnabled(false)
                _ui.value = _ui.value.copy(
                    profile = restored ?: _ui.value.profile,
                    healthEnergyGoalsEnabled = false,
                    applyingHealthEnergyGoals = false
                )
                return@launch
            }
            applyHealthEnergyGoals(saveExistingTargets = !_ui.value.healthEnergyGoalsEnabled)
        }
    }

    fun refreshHealthEnergyGoals() {
        viewModelScope.launch {
            applyHealthEnergyGoals(saveExistingTargets = false)
        }
    }

    fun dismissHealthEnergyGoalAlert() {
        _ui.value = _ui.value.copy(
            healthEnergyGoalAlertTitle = null,
            healthEnergyGoalAlertMessage = null
        )
    }

    fun setAdaptiveGoalsEnabled(v: Boolean) {
        viewModelScope.launch {
            container.prefs.setAdaptiveGoalsEnabled(v)
            if (!v) {
                val current = container.profileRepository.current()
                val restored = current?.let { container.prefs.restoreAdaptiveGoalPreviousTargets(it) }
                if (restored != null) {
                    container.profileRepository.save(restored)
                }
                container.prefs.clearAdaptiveGoalPreviousTargets()
                _ui.value = _ui.value.copy(
                    profile = restored ?: _ui.value.profile,
                    adaptiveGoalsEnabled = false,
                    applyingAdaptiveGoals = false
                )
                return@launch
            }

            _ui.value = _ui.value.copy(
                adaptiveGoalsEnabled = true,
                applyingAdaptiveGoals = true
            )
            val result = container.refreshAdaptiveGoalsIfNeeded(force = true)
            _ui.value = _ui.value.copy(
                profile = result?.profile ?: container.profileRepository.current() ?: _ui.value.profile,
                adaptiveGoalsEnabled = true,
                applyingAdaptiveGoals = false,
                adaptiveGoalAlertTitle = "Adaptive Goals",
                adaptiveGoalAlertMessage = result?.message
                    ?: "Adaptive Goals is on. Fud AI will check once per week after enough food and weight data exists."
            )
        }
    }

    fun dismissAdaptiveGoalAlert() {
        _ui.value = _ui.value.copy(
            adaptiveGoalAlertTitle = null,
            adaptiveGoalAlertMessage = null
        )
    }

    private suspend fun applyHealthEnergyGoals(saveExistingTargets: Boolean) {
        if (_ui.value.applyingHealthEnergyGoals) return
        _ui.value = _ui.value.copy(applyingHealthEnergyGoals = true)
        try {
            val profile = container.profileRepository.current()
            if (profile == null) {
                container.prefs.setHealthEnergyGoalsEnabled(false)
                showHealthEnergyGoalAlert(
                    title = "Profile Needed",
                    message = "Finish your profile before using Health Connect energy goals."
                )
                return
            }

            val granted = container.health.isAvailable() && container.health.hasAllPermissions()
            if (!granted) {
                container.prefs.setHealthEnergyGoalsEnabled(false)
                showHealthEnergyGoalAlert(
                    title = "Health Connect Needed",
                    message = "Allow Fud AI to read Active Calories and Total Calories in Health Connect, then try again."
                )
                return
            }

            if (saveExistingTargets) {
                container.prefs.saveHealthEnergyGoalPreviousTargetsIfNeeded(profile)
            }

            container.prefs.setHealthConnectEnabled(true)
            container.prefs.setHealthPermissionsVersion(HealthConnectManager.CURRENT_TYPES_VERSION)
            val summary = container.health.readRecentEnergySummary(days = 14)
            if (summary == null) {
                container.prefs.setHealthEnergyGoalsEnabled(false)
                showHealthEnergyGoalAlert(
                    title = "Not Enough Energy Data",
                    message = "Fud AI needs at least 3 recent days of Health Connect energy data to estimate goals."
                )
                return
            }

            val suggestion = container.foodAnalysis.suggestHealthEnergyGoals(
                profile = profile,
                energy = summary,
                useMetric = container.prefs.useMetric.first()
            )
            val next = profile.copy(
                customCalories = suggestion.calories,
                customProtein = null,
                customCarbs = null,
                customFat = null,
                autoBalanceMacro = null
            )
            container.profileRepository.save(next)
            container.prefs.setHealthEnergyGoalsEnabled(true)
            container.prefs.setHealthEnergyGoalsLastAutoRefreshDay(LocalDate.now().toString())
            val adaptiveResult = container.refreshAdaptiveGoalsIfNeeded(force = false)
            val reason = suggestion.reason?.takeIf { it.isNotBlank() }?.let { "\n\n$it" }.orEmpty()
            val adaptiveMessage = adaptiveResult
                ?.takeIf { it.changed }
                ?.let { "\n\n${it.message}" }
                .orEmpty()
            _ui.value = _ui.value.copy(
                profile = adaptiveResult?.profile ?: next,
                healthConnectEnabled = true,
                healthEnergyGoalsEnabled = true,
                healthEnergyGoalAlertTitle = "Goals Updated",
                healthEnergyGoalAlertMessage = "Updated to ${suggestion.calories} kcal using ${summary.daysUsed} days of Health Connect energy. Protein, carbs, and fat remain unlocked on auto-balance so you can lock them manually later.$reason$adaptiveMessage"
            )
        } catch (e: Throwable) {
            container.prefs.setHealthEnergyGoalsEnabled(false)
            showHealthEnergyGoalAlert(
                title = "AI Estimate Failed",
                message = e.localizedMessage ?: "AI estimate failed. Please try again."
            )
        } finally {
            _ui.value = _ui.value.copy(applyingHealthEnergyGoals = false)
        }
    }

    private fun showHealthEnergyGoalAlert(title: String, message: String) {
        _ui.value = _ui.value.copy(
            healthEnergyGoalsEnabled = false,
            healthEnergyGoalAlertTitle = title,
            healthEnergyGoalAlertMessage = message
        )
    }

    private suspend fun backfillHealthConnect() {
        if (!container.health.hasAllPermissions()) return

        container.foodRepository.entries.first().forEach { entry ->
            container.health.updateNutrition(entry)
        }
        container.weightRepository.entries.first().forEach { entry ->
            container.health.deleteWeight(entry.id)
            container.health.writeWeight(entry)
        }
        container.bodyFatRepository.entries.first().forEach { entry ->
            container.health.deleteBodyFat(entry.id)
            container.health.writeBodyFat(entry)
        }
    }

    fun deleteAllData(onComplete: () -> Unit = {}) {
        viewModelScope.launch {
            container.prefs.clearAll()
            container.keyStore.clearAll()
            container.imageStore.clearAll()
            onComplete()
        }
    }

    fun clearFoodLog() {
        viewModelScope.launch {
            container.foodRepository.clear()
            container.imageStore.clearAll()
        }
    }

    fun recalculateGoals() {
        viewModelScope.launch {
            if (_ui.value.recalculatingGoals) return@launch
            val current = container.profileRepository.current() ?: return@launch
            _ui.value = _ui.value.copy(recalculatingGoals = true)
            val useMetric = container.prefs.useMetric.first()
            // Empirical signal: recent logged intake + observed weight trend, so the AI can
            // estimate true maintenance (hit-and-trial) instead of trusting the formula alone.
            val forecast = WeightAnalysisService.compute(
                weights = container.weightRepository.entries.first(),
                foods = container.foodRepository.entries.first(),
                profile = current
            )
            // AI calorie target with macros reset to auto-balance (unlocked); fall back to the
            // deterministic formula when AI is unavailable so a valid goal is always produced.
            var message: String
            val next = try {
                val result = container.foodAnalysis.calculateGoals(current, forecast, useMetric)
                message = "Updated to ${result.calories} kcal." + (result.reason?.let { " $it" } ?: "")
                current.recalculatedFromFormulas().copy(customCalories = result.calories)
            } catch (e: Throwable) {
                message = "Used the standard formula — AI unavailable (${e.localizedMessage ?: "check your AI provider key in Settings"})."
                current.recalculatedFromFormulas()
            }
            container.profileRepository.save(next)
            // Also AI-refresh the optional Other Nutrients; keep existing values on failure.
            try {
                val goals = container.foodAnalysis.estimateOptionalNutrientGoals(next)
                container.prefs.setOptionalNutrientGoals(goals)
                _ui.value = _ui.value.copy(optionalNutrientGoals = goals)
            } catch (_: Throwable) { /* keep existing nutrient goals */ }
            val adaptiveResult = container.refreshAdaptiveGoalsIfNeeded(force = false)
            val adaptiveNote = adaptiveResult?.takeIf { it.changed }?.let { "\n\n${it.message}" } ?: ""
            _ui.value = _ui.value.copy(
                recalculatingGoals = false,
                profile = adaptiveResult?.profile ?: next,
                adaptiveGoalAlertTitle = "Goals Recalculated",
                adaptiveGoalAlertMessage = message + adaptiveNote
            )
        }
    }

    /**
     * Settings → Weight save: writes a WeightEntry (so the chart, Coach forecast,
     * and Health Connect sync see the change), clears goalWeightKg if the new
     * current weight makes the goal direction impossible, and recomputes calories
     * + macros from formulas (since BMR/TDEE depend on weight). Mirrors iOS
     * ContentView.swift `case .editWeight` which also calls resetCustomGoalsAndSave.
     */
    fun saveCurrentWeight(newKg: Double) {
        viewModelScope.launch {
            val current = container.profileRepository.current() ?: return@launch
            val gw = current.goalWeightKg
            val mismatch = gw != null && (
                (current.goal == WeightGoal.LOSE && gw >= newKg) ||
                (current.goal == WeightGoal.GAIN && gw <= newKg)
            )
            // WeightRepository.addEntry syncs profile.weightKg to the new value internally.
            container.weightRepository.addEntry(WeightEntry(weightKg = newKg))
            val refreshed = container.profileRepository.current() ?: return@launch
            val next = refreshed.copy(
                goalWeightKg = if (mismatch) null else refreshed.goalWeightKg
            ).recalculatedFromFormulas()
            container.profileRepository.save(next)
            val adaptiveResult = container.refreshAdaptiveGoalsIfNeeded(force = false)
            _ui.value = _ui.value.copy(profile = adaptiveResult?.profile ?: next)
        }
    }

    fun updateProfile(update: (com.apoorvdarshan.calorietracker.models.UserProfile) -> com.apoorvdarshan.calorietracker.models.UserProfile) {
        viewModelScope.launch {
            val current = container.profileRepository.current() ?: return@launch
            val next = update(current)
            container.profileRepository.save(next)
            _ui.value = _ui.value.copy(profile = next)
        }
    }

    /**
     * Like [updateProfile] but also resets custom calories + macros to formula defaults.
     * Use this for changes to inputs that feed BMR/TDEE/protein formulas (gender, height,
     * body fat, activity level, goal, weekly change). Mirrors iOS resetCustomGoalsAndSave.
     */
    fun updateProfileAndRecompute(update: (com.apoorvdarshan.calorietracker.models.UserProfile) -> com.apoorvdarshan.calorietracker.models.UserProfile) {
        viewModelScope.launch {
            val current = container.profileRepository.current() ?: return@launch
            val next = update(current).recalculatedFromFormulas()
            container.profileRepository.save(next)
            val adaptiveResult = container.refreshAdaptiveGoalsIfNeeded(force = false)
            _ui.value = _ui.value.copy(profile = adaptiveResult?.profile ?: next)
        }
    }

    fun setCustomBaseUrl(provider: AIProvider, url: String) {
        viewModelScope.launch {
            container.prefs.setCustomBaseUrl(provider, url.takeIf { it.isNotBlank() })
        }
    }

    private fun maskKey(key: String?): String =
        if (key.isNullOrBlank()) "" else key.take(4) + "..." + key.takeLast(4)

    class Factory(private val container: AppContainer) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            SettingsViewModel(container) as T
    }
}
