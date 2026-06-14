import Foundation
import SwiftUI

/// Local-only store for body-circumference history. Mirrors WeightStore / BodyFatStore but does
/// NOT sync anything back to UserProfile — circumferences are extra signal for the AI, not a
/// profile field. Entirely optional: an empty store means the feature is simply invisible to the
/// goal calc and the Coach.
@Observable
class BodyMeasurementStore {
    private(set) var entries: [BodyMeasurement] = []

    private let storageKey = "bodyMeasurementEntries"

    init() {
        loadEntries()
    }

    var latestEntry: BodyMeasurement? {
        entries.sorted { $0.date > $1.date }.first
    }

    /// Newest-first, for history lists.
    var sortedEntries: [BodyMeasurement] {
        entries.sorted { $0.date > $1.date }
    }

    func addEntry(_ entry: BodyMeasurement) {
        guard entry.hasAnyValue else { return }
        entries.append(entry)
        saveEntries()
    }

    func deleteEntry(_ entry: BodyMeasurement) {
        let id = entry.id
        entries.removeAll { $0.id == id }
        saveEntries()
    }

    func replaceAllEntries(_ newEntries: [BodyMeasurement]) {
        entries = newEntries
        saveEntries()
    }

    private func saveEntries() {
        if let data = try? JSONEncoder().encode(entries) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func loadEntries() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([BodyMeasurement].self, from: data)
        else { return }
        entries = decoded
    }
}
