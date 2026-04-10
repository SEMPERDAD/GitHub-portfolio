import Foundation

/// Date-related utility functions.
enum DateHelper {
    /// Calendar weekdays ordered Sunday(1) through Saturday(7).
    static let orderedWeekdays: [Int] = [1, 2, 3, 4, 5, 6, 7]

    /// Short weekday name for a Calendar weekday number (1=Sun).
    static func shortWeekdayName(_ weekday: Int) -> String {
        let symbols = Calendar.current.veryShortWeekdaySymbols // ["S", "M", "T", …]
        let index = (weekday - 1) % 7
        return symbols[index]
    }

    /// Human-readable weekday string for a set of weekdays.
    static func weekdayNames(for weekdays: Set<Int>) -> String {
        let sorted = weekdays.sorted()
        let names = sorted.map { shortWeekdayName($0) }
        return names.joined(separator: ", ")
    }

    /// Formatted date string for the Today view.
    static func todayFormatted() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: Date())
    }

    /// Start of a given day.
    static func startOfDay(_ date: Date) -> Date {
        Calendar.current.startOfDay(for: date)
    }

    /// Whether two dates fall on the same calendar day.
    static func isSameDay(_ a: Date, _ b: Date) -> Bool {
        Calendar.current.isDate(a, inSameDayAs: b)
    }
}
