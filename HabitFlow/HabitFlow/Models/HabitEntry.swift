import Foundation
import SwiftData

/// A single completion record for a habit on a specific date.
@Model
final class HabitEntry {
    var id: UUID
    var completedDate: Date
    var habit: Habit?

    init(completedDate: Date = Date(), habit: Habit) {
        self.id = UUID()
        self.completedDate = completedDate
        self.habit = habit
    }
}
