import SwiftUI

struct HabitRowView: View {
    let habit: Habit
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button(action: onToggle) {
                Image(systemName: habit.isCompletedToday ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(habit.isCompletedToday ? .green : .gray)
            }
            .buttonStyle(.plain)

            Text(habit.name)
                .font(.body)
                .strikethrough(habit.isCompletedToday, color: .gray)
                .foregroundColor(habit.isCompletedToday ? .secondary : .primary)

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .foregroundColor(habit.currentStreak > 0 ? .orange : .gray.opacity(0.4))
                Text("\(habit.currentStreak)")
                    .font(.headline)
                    .foregroundColor(habit.currentStreak > 0 ? .orange : .gray)
            }
        }
        .padding(.vertical, 4)
    }
}
