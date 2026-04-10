import Foundation
import UserNotifications

/// Handles scheduling and cancelling local notifications for habit reminders.
final class NotificationManager {
    static let shared = NotificationManager()
    private init() {}

    private let center = UNUserNotificationCenter.current()

    /// Request notification authorization from the user.
    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification auth error: \(error.localizedDescription)")
            }
            completion(granted)
        }
    }

    /// Schedule a daily repeating notification for a habit.
    func scheduleReminder(for habit: Habit, at time: Date) {
        // Cancel any existing reminder first
        cancelReminder(for: habit)

        let content = UNMutableNotificationContent()
        content.title = "HabitFlow Reminder"
        content.body = "Time to complete: \(habit.name)"
        content.sound = .default
        content.categoryIdentifier = "habitReminder"

        let calendar = Calendar.current
        let components = calendar.dateComponents([.hour, .minute], from: time)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: notificationId(for: habit),
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error.localizedDescription)")
            }
        }
    }

    /// Cancel the reminder for a specific habit.
    func cancelReminder(for habit: Habit) {
        center.removePendingNotificationRequests(withIdentifiers: [notificationId(for: habit)])
    }

    /// Cancel all app notifications.
    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }

    /// Unique notification identifier tied to a habit's UUID.
    private func notificationId(for habit: Habit) -> String {
        "habitflow.reminder.\(habit.id.uuidString)"
    }
}
