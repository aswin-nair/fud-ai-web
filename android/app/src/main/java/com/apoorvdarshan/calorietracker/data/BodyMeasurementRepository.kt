package com.apoorvdarshan.calorietracker.data

import com.apoorvdarshan.calorietracker.models.BodyMeasurement
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.UUID

/**
 * Local-only store for body-circumference history. Mirrors WeightRepository / BodyFatRepository but
 * does NOT sync anything back to UserProfile — circumferences are extra signal for the AI, not a
 * profile field. Entirely optional: an empty store means the feature is invisible to the goal calc
 * and the Coach.
 */
class BodyMeasurementRepository(private val prefs: PreferencesStore) {
    val entries: Flow<List<BodyMeasurement>> =
        prefs.bodyMeasurements.map { it.sortedBy { e -> e.date } }

    val latest: Flow<BodyMeasurement?> =
        prefs.bodyMeasurements.map { list -> list.maxByOrNull { it.date } }

    suspend fun addEntry(entry: BodyMeasurement) {
        if (!entry.hasAnyValue) return
        val current = prefs.bodyMeasurements.first()
        prefs.setBodyMeasurements(current + entry)
    }

    suspend fun deleteEntry(id: UUID) {
        val current = prefs.bodyMeasurements.first()
        prefs.setBodyMeasurements(current.filter { it.id != id })
    }

    suspend fun replaceAll(entries: List<BodyMeasurement>) {
        prefs.setBodyMeasurements(entries)
    }

    suspend fun clear() {
        prefs.setBodyMeasurements(emptyList())
    }

    /** Current latest snapshot — used by the goal calc + Coach call sites. */
    suspend fun latestSnapshot(): BodyMeasurement? =
        prefs.bodyMeasurements.first().maxByOrNull { it.date }
}
