import Foundation

struct Habit: Identifiable, Codable {
    let id: UUID
    var name: String
    var completedDates: [String] // "yyyy-MM-dd" format
    let createdDate: Date

    init(id: UUID = UUID(), name: String, completedDates: [String] = [], createdDate: Date = Date()) {
        self.id = id
        self.name = name
        self.completedDates = completedDates
        self.createdDate = createdDate
    }

    var currentStreak: Int {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let completedSet = Set(completedDates)

        var streak = 0
        var checkDate = Date()

        // If today isn't completed, start counting from yesterday
        let todayString = formatter.string(from: checkDate)
        if !completedSet.contains(todayString) {
            guard let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: checkDate) else {
                return 0
            }
            checkDate = yesterday
        }

        // Walk backwards counting consecutive days
        while true {
            let dateString = formatter.string(from: checkDate)
            if completedSet.contains(dateString) {
                streak += 1
                guard let previousDay = Calendar.current.date(byAdding: .day, value: -1, to: checkDate) else {
                    break
                }
                checkDate = previousDay
            } else {
                break
            }
        }

        return streak
    }

    var isCompletedToday: Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayString = formatter.string(from: Date())
        return completedDates.contains(todayString)
    }
}
