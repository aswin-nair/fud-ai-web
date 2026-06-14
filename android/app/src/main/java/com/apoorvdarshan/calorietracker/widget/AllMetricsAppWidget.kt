package com.apoorvdarshan.calorietracker.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import com.apoorvdarshan.calorietracker.MainActivity
import com.apoorvdarshan.calorietracker.R
import com.apoorvdarshan.calorietracker.data.PreferencesStore
import com.apoorvdarshan.calorietracker.models.WidgetSnapshot
import kotlinx.coroutines.flow.first

/**
 * Single "all today's metrics" widget — calories ring + protein / carbs / fat together, so users
 * can see everything at a glance from one widget instead of adding the separate Calorie and Protein
 * widgets. Reuses the shared building blocks (RingWithCenter, CapsuleMacroRow, WidgetHeader).
 */
class AllMetricsAppWidget : GlanceAppWidget() {

    override val sizeMode: SizeMode = SizeMode.Responsive(
        setOf(WIDE_SIZE, TALL_SIZE)
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // Never let a data-read failure leave the widget stuck on the loading layout.
        val snapshot = runCatching {
            PreferencesStore(context).widgetSnapshot.first()?.takeUnless { it.isStale }
        }.getOrNull() ?: WidgetSnapshot.empty()

        provideContent {
            GlanceTheme {
                AllMetricsContent(snapshot)
            }
        }
    }

    companion object {
        val WIDE_SIZE = DpSize(250.dp, 110.dp)
        val TALL_SIZE = DpSize(250.dp, 220.dp)
    }
}

class AllMetricsWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = AllMetricsAppWidget()
}

@Composable
private fun AllMetricsContent(snapshot: WidgetSnapshot) {
    val size = LocalSize.current
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(WidgetTheme.backgroundProvider)
            .cornerRadius(22.dp)
            .padding(14.dp)
            .clickable(actionStartActivity<MainActivity>())
    ) {
        if (size.height < AllMetricsAppWidget.TALL_SIZE.height) {
            AllMetricsWide(snapshot)
        } else {
            AllMetricsTall(snapshot)
        }
    }
}

@Composable
private fun AllMetricsWide(snapshot: WidgetSnapshot) {
    Row(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RingWithCenter(
            progress = snapshot.calorieProgress.toFloat(),
            ringSizeDp = 96,
            strokeDp = 9,
            centerLarge = snapshot.calories.toString(),
            centerSmall = "/ ${snapshot.calorieGoal}",
            centerCaption = "kcal"
        )
        Spacer(modifier = GlanceModifier.width(14.dp))
        Column(
            modifier = GlanceModifier.fillMaxHeight().defaultWeight(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CapsuleMacroRow("Protein", snapshot.protein, snapshot.proteinGoal, snapshot.proteinProgress.toFloat(), unit = "g")
            Spacer(modifier = GlanceModifier.height(8.dp))
            CapsuleMacroRow("Carbs", snapshot.carbs, snapshot.carbsGoal, snapshot.carbsProgress.toFloat(), unit = "g")
            Spacer(modifier = GlanceModifier.height(8.dp))
            CapsuleMacroRow("Fat", snapshot.fat, snapshot.fatGoal, snapshot.fatProgress.toFloat(), unit = "g")
        }
    }
}

@Composable
private fun AllMetricsTall(snapshot: WidgetSnapshot) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
        WidgetHeader(iconRes = R.drawable.ic_widget_flame, label = "Today")
        Spacer(modifier = GlanceModifier.height(8.dp))
        Box(
            modifier = GlanceModifier.fillMaxWidth(),
            contentAlignment = Alignment.Center
        ) {
            RingWithCenter(
                progress = snapshot.calorieProgress.toFloat(),
                ringSizeDp = 104,
                strokeDp = 10,
                centerLarge = snapshot.calories.toString(),
                centerSmall = "/ ${snapshot.calorieGoal}",
                centerCaption = "kcal"
            )
        }
        Spacer(modifier = GlanceModifier.height(12.dp))
        CapsuleMacroRow("Protein", snapshot.protein, snapshot.proteinGoal, snapshot.proteinProgress.toFloat(), unit = "g")
        Spacer(modifier = GlanceModifier.height(8.dp))
        CapsuleMacroRow("Carbs", snapshot.carbs, snapshot.carbsGoal, snapshot.carbsProgress.toFloat(), unit = "g")
        Spacer(modifier = GlanceModifier.height(8.dp))
        CapsuleMacroRow("Fat", snapshot.fat, snapshot.fatGoal, snapshot.fatProgress.toFloat(), unit = "g")
    }
}
