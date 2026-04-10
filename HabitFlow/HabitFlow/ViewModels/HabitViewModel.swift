import Foundation
import SwiftUI
import SwiftData

/// View model powering the Today screen and habit management.
@Observable
final class HabitViewModel {
    private var modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - Fetching

    /// All habits sorted by creation order.
    func allHabits() -> [Habit] {
        let descriptor = FetchDescriptor<Habit>(sortBy: [SortDescriptor(\.createdAt)])
        return (try? modelContext.fetch(descriptor)) ?? []
    }

    /// Habits scheduled for today.
    func todaysHabits() -> [Habit] {
        let today = Date()
        return allHabits().filter { $0.isScheduled(for: today) }
    }

    /// Today's completion fraction (0.0–1.0).
    func todayProgress() -> Double {
        let habits = todaysHabits()
        guard !habits.isEmpty else { return 0 }
        let completed = habits.filter { $0.isCompleted(on: Date()) }.count
        return Double(completed) / Double(habits.count)
    }

    /// Number of habits completed today.
    func completedTodayCount() -> Int {
        todaysHabits().filter { $0.isCompleted(on: Date()) }.count
    }

    // MARK: - Actions

    /// Toggle completion for a habit on a given date.
    func toggleCompletion(for habit: Habit, on date: Date = Date()) {
        if let existingEntry = habit.entry(for: date) {
            modelContext.delete(existingEntry)
        } else {
            let entry = HabitEntry(completedDate: date, habit: habit)
            modelContext.insert(entry)
        }
        try? modelContext.save()
    }

    /// Create a new habit.
    func addHabit(
        name: String,
        iconName: String,
        colorHex: String,
        frequency: HabitFrequency,
        reminderTime: Date?
    ) {
        let habit = Habit(
            name: name,
            iconName: iconName,
            colorHex: colorHex,
            frequency: frequency,
            reminderTime: reminderTime,
            sortOrder: allHabits().count
        )
        modelContext.insert(habit)
        try? modelContext.save()

        // Schedule notification if reminder is set
        if let reminder = reminderTime {
            NotificationManager.shared.scheduleReminder(for: habit, at: reminder)
        }
    }

    /// Update an existing habit.
    func updateHabit(
        _ habit: Habit,
        name: String,
        iconName: String,
        colorHex: String,
        frequency: HabitFrequency,
        reminderTime: Date?
    ) {
        habit.name = name
        habit.iconName = iconName
        habit.colorHex = colorHex
        habit.frequency = frequency

        // Update notification
        NotificationManager.shared.cancelReminder(for: habit)
        habit.reminderTime = reminderTime
        if let reminder = reminderTime {
            NotificationManager.shared.scheduleReminder(for: habit, at: reminder)
        }

        try? modelContext.save()
    }

    /// Delete a habit and all its entries.
    func deleteHabit(_ habit: Habit) {
        NotificationManager.shared.cancelReminder(for: habit)
        modelContext.delete(habit)
        try? modelContext.save()
    }

    /// Delete all habits and entries (used by Settings reset).
    func resetAllData() {
        let habits = allHabits()
        for habit in habits {
            NotificationManager.shared.cancelReminder(for: habit)
            modelContext.delete(habit)
        }
        try? modelContext.save()

        // Reset first-launch flag so seed data appears next launch
        UserDefaults.standard.set(false, forKey: "hasLaunchedBefore")
    }
}
