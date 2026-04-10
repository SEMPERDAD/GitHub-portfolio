import Foundation
import SwiftData

/// Frequency options for a habit.
enum HabitFrequency: Codable, Hashable {
    case daily
    case specificDays(Set<Int>)  // 1=Sunday … 7=Saturday (Calendar weekday)
    case timesPerWeek(Int)
}

/// A single trackable habit.
@Model
final class Habit {
    var id: UUID
    var name: String
    var iconName: String
    var colorHex: String
    var reminderTime: Date?
    var createdAt: Date
    var sortOrder: Int

    /// Stored as JSON-encoded Data because SwiftData cannot persist enums with associated values.
    var frequencyData: Data = Data()

    @Relationship(deleteRule: .cascade, inverse: \HabitEntry.habit)
    var entries: [HabitEntry] = []

    /// Computed accessor for the typed frequency enum.
    @Transient
    var frequency: HabitFrequency {
        get {
            guard !frequencyData.isEmpty,
                  let decoded = try? JSONDecoder().decode(HabitFrequency.self, from: frequencyData) else {
                return .daily
            }
            return decoded
        }
        set {
            frequencyData = (try? JSONEncoder().encode(newValue)) ?? Data()
        }
    }

    init(
        name: String,
        iconName: String = "circle.fill",
        colorHex: String = "#1A8C7A",
        frequency: HabitFrequency = .daily,
        reminderTime: Date? = nil,
        sortOrder: Int = 0
    ) {
        self.id = UUID()
        self.name = name
        self.iconName = iconName
        self.colorHex = colorHex
        self.frequencyData = (try? JSONEncoder().encode(frequency)) ?? Data()
        self.reminderTime = reminderTime
        self.createdAt = Date()
        self.sortOrder = sortOrder
    }

    // MARK: - Scheduling helpers

    /// Whether this habit is scheduled for the given date.
    func isScheduled(for date: Date) -> Bool {
        let calendar = Calendar.current

        // Don't show habits before they were created
        guard calendar.startOfDay(for: date) >= calendar.startOfDay(for: createdAt) else {
            return false
        }

        switch frequency {
        case .daily:
            return true
        case .specificDays(let weekdays):
            let dayOfWeek = calendar.component(.weekday, from: date)
            return weekdays.contains(dayOfWeek)
        case .timesPerWeek:
            // Always show — the user decides which days to complete it
            return true
        }
    }

    // MARK: - Completion helpers

    /// Whether the habit was completed on the given date.
    func isCompleted(on date: Date) -> Bool {
        let calendar = Calendar.current
        return entries.contains { calendar.isDate($0.completedDate, inSameDayAs: date) }
    }

    /// The entry for a specific date, if it exists.
    func entry(for date: Date) -> HabitEntry? {
        let calendar = Calendar.current
        return entries.first { calendar.isDate($0.completedDate, inSameDayAs: date) }
    }

    // MARK: - Streak calculation

    /// Current consecutive-day streak ending today (or yesterday if not yet completed today).
    var currentStreak: Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        // Collect all unique completion dates, sorted descending
        let completionDays = Set(entries.map { calendar.startOfDay(for: $0.completedDate) })
            .sorted(by: >)

        guard !completionDays.isEmpty else { return 0 }

        var streak = 0
        var checkDate = today

        // If today is not completed, start checking from yesterday
        if !completionDays.contains(today) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: today) else {
                return 0
            }
            checkDate = yesterday
        }

        // Walk backwards through scheduled days
        while true {
            if isScheduled(for: checkDate) {
                if completionDays.contains(checkDate) {
                    streak += 1
                } else {
                    break
                }
            }
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: checkDate) else {
                break
            }
            checkDate = previousDay

            // Safety: don't go further back than creation date
            if checkDate < calendar.startOfDay(for: createdAt) {
                break
            }
        }

        return streak
    }

    /// Longest streak ever achieved.
    var longestStreak: Int {
        let calendar = Calendar.current
        let completionDays = Set(entries.map { calendar.startOfDay(for: $0.completedDate) })

        guard !completionDays.isEmpty else { return 0 }

        let sortedDays = completionDays.sorted()
        var longest = 0
        var current = 0
        var expectedDate: Date?

        for day in sortedDays {
            // Only count scheduled days
            guard isScheduled(for: day) else { continue }

            if let expected = expectedDate {
                // Find the next scheduled date after `expected - 1 day`
                if day == expected || day == nextScheduledDate(after: expected, calendar: calendar) {
                    current += 1
                } else {
                    current = 1
                }
            } else {
                current = 1
            }

            longest = max(longest, current)

            // Find next expected scheduled date
            var next = calendar.date(byAdding: .day, value: 1, to: day)!
            while !isScheduled(for: next) && next <= Date() {
                next = calendar.date(byAdding: .day, value: 1, to: next)!
            }
            expectedDate = next
        }

        return longest
    }

    private func nextScheduledDate(after date: Date, calendar: Calendar) -> Date? {
        var check = date
        for _ in 0..<7 {
            if isScheduled(for: check) {
                return check
            }
            check = calendar.date(byAdding: .day, value: 1, to: check)!
        }
        return nil
    }

    /// Total number of completions.
    var totalCompletions: Int {
        entries.count
    }

    /// Completion rate over the last 30 days (0.0–1.0).
    var completionRate30Days: Double {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var scheduledCount = 0
        var completedCount = 0

        for offset in 0..<30 {
            guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { continue }
            if isScheduled(for: date) {
                scheduledCount += 1
                if isCompleted(on: date) {
                    completedCount += 1
                }
            }
        }

        guard scheduledCount > 0 else { return 0 }
        return Double(completedCount) / Double(scheduledCount)
    }
}
