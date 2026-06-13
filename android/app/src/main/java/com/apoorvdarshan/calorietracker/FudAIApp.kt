package com.apoorvdarshan.calorietracker

import android.app.Application
import com.apoorvdarshan.calorietracker.data.BodyFatRepository
import com.apoorvdarshan.calorietracker.data.ChatRepository
import com.apoorvdarshan.calorietracker.data.FoodRepository
import com.apoorvdarshan.calorietracker.data.KeyStore
import com.apoorvdarshan.calorietracker.data.PreferencesStore
import com.apoorvdarshan.calorietracker.data.ProfileRepository
import com.apoorvdarshan.calorietracker.data.WeightRepository
import com.apoorvdarshan.calorietracker.services.FoodImageStore
import com.apoorvdarshan.calorietracker.services.NotificationService
import com.apoorvdarshan.calorietracker.services.TestDataSeeder
import com.apoorvdarshan.calorietracker.services.WidgetSnapshotWriter
import com.apoorvdarshan.calorietracker.services.AdaptiveGoalResult
import com.apoorvdarshan.calorietracker.services.AdaptiveGoalService
import com.apoorvdarshan.calorietracker.services.ai.ChatService
import com.apoorvdarshan.calorietracker.services.ai.FoodAnalysisService
import com.apoorvdarshan.calorietracker.services.health.HealthConnectManager
import com.apoorvdarshan.calorietracker.services.speech.SpeechService
import kotlin.math.roundToInt
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * Application-scoped singleton wiring. Manual DI (no Hilt) — repositories and
 * services are instantiated once and handed to ViewModels via [container].
 */
class FudAIApp : Application() {

    lateinit var container: AppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.notifications.createChannels()
        container.widgetSnapshotWriter.observe().launchIn(appScope)
        // Re-arm the daily weight-log alarm on every cold start. AlarmManager
        // drops scheduled alarms on device reboot and (sometimes) on app
        // updates — without this, a user who enabled Notifications once would
        // silently stop receiving the reminder after the next reboot.
        appScope.launch {
            if (container.prefs.notificationsEnabled.first() &&
                container.notifications.canPostNotifications()
            ) {
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
                // Body-fat reminder only fires for users who've actually opted
                // into body-fat tracking and left that notification type on.
                val profile = container.profileRepository.current()
                if (container.prefs.bodyFatReminderEnabled.first() && profile?.bodyFatPercentage != null) {
                    container.notifications.scheduleBodyFatReminder()
                } else {
                    container.notifications.cancelBodyFatReminder()
                }
            }
        }
    }
}

class AppContainer(app: FudAIApp) {
    val appContext = app.applicationContext
    val prefs = PreferencesStore(app)
    val keyStore = KeyStore(app)
    val imageStore = FoodImageStore(app)
    val notifications = NotificationService(app)
    val health = HealthConnectManager(app)

    val profileRepository = ProfileRepository(prefs)
    val foodRepository = FoodRepository(prefs, health)
    val weightRepository = WeightRepository(prefs, profileRepository, health)
    val bodyFatRepository = BodyFatRepository(prefs, profileRepository, health)
    val chatRepository = ChatRepository(prefs)

    val foodAnalysis = FoodAnalysisService(prefs, keyStore)
    val chatService = ChatService(prefs, keyStore)
    val speechService = SpeechService(prefs, keyStore)

    val widgetSnapshotWriter = WidgetSnapshotWriter(app, prefs, foodRepository, profileRepository)
    val testDataSeeder = TestDataSeeder(this)

    /**
     * App-scoped flag set by [HomeViewModel] while a food analysis request is
     * in flight. The bottom nav reads this so the bar can hide during the
     * AnalyzingOverlay (matches iOS, where the analyzing sheet covers the
     * tab bar).
     */
    val analyzingFood: MutableStateFlow<Boolean> = MutableStateFlow(false)

    private var healthEnergyGoalsRefreshInFlight = false
    private var adaptiveGoalsRefreshInFlight = false

    suspend fun refreshHealthEnergyGoalsIfNeeded() {
        if (healthEnergyGoalsRefreshInFlight) return
        healthEnergyGoalsRefreshInFlight = true
        try {
            if (!prefs.healthEnergyGoalsEnabled.first()) return
            if (!prefs.healthConnectEnabled.first()) return
            if (!health.isAvailable() || !health.hasAllPermissions()) return

            val today = LocalDate.now().toString()
            if (prefs.healthEnergyGoalsLastAutoRefreshDay.first() == today) return

            val profile = profileRepository.current() ?: return
            prefs.setHealthEnergyGoalsLastAutoRefreshDay(today)

            val summary = health.readRecentEnergySummary(days = 14) ?: return
            val suggestion = foodAnalysis.suggestHealthEnergyGoals(
                profile = profile,
                energy = summary,
                useMetric = prefs.useMetric.first()
            )
            profileRepository.save(
                profile.copy(
                    customCalories = suggestion.calories,
                    customProtein = null,
                    customCarbs = null,
                    customFat = null,
                    autoBalanceMacro = null
                )
            )
        } catch (_: Exception) {
            // Auto-refresh is opportunistic; Settings keeps the visible manual
            // Refresh path for errors and retries.
        } finally {
            healthEnergyGoalsRefreshInFlight = false
        }
    }

    suspend fun refreshAdaptiveGoalsIfNeeded(force: Boolean = false): AdaptiveGoalResult? {
        if (adaptiveGoalsRefreshInFlight) return null
        adaptiveGoalsRefreshInFlight = true
        try {
            if (!prefs.adaptiveGoalsEnabled.first()) return null

            val today = LocalDate.now()
            if (!force && !shouldCheckAdaptiveGoals(prefs.adaptiveGoalsLastCheckDay.first(), today)) {
                return null
            }

            val profile = profileRepository.current() ?: return null
            // Burn-aware (Energy Burn folded in): use Health Connect measured energy as the
            // maintenance basis when connected; otherwise the weight-trend correction stands alone.
            val measuredTdee: Int? = runCatching {
                if (prefs.healthConnectEnabled.first() && health.isAvailable() && health.hasAllPermissions()) {
                    health.readRecentEnergySummary(days = 14)?.let { s ->
                        s.totalAverageCalories ?: (profile.bmr.roundToInt() + s.activeAverageCalories)
                    }
                } else null
            }.getOrNull()
            val result = AdaptiveGoalService.apply(
                profile = profile,
                weights = weightRepository.entries.first(),
                foods = foodRepository.entries.first(),
                measuredTdee = measuredTdee
            )
            prefs.setAdaptiveGoalsLastCheckDay(today.toString())
            if (result.changed) {
                prefs.saveAdaptiveGoalPreviousTargetsIfNeeded(profile)
                profileRepository.save(result.profile)
            }
            return result
        } finally {
            adaptiveGoalsRefreshInFlight = false
        }
    }

    private fun shouldCheckAdaptiveGoals(lastCheckDay: String?, today: LocalDate): Boolean {
        val lastCheck = lastCheckDay?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            ?: return true
        return !lastCheck.plusDays(7).isAfter(today)
    }
}
