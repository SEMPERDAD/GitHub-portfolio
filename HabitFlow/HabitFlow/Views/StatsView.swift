import SwiftUI
import SwiftData

/// The "Stats" tab showing streaks and completion history.
struct StatsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var habits: [Habit]

    private var todaysHabits: [Habit] {
        habits.filter { $0.isScheduled(for: Date()) }
    }

    private var completedToday: Int {
        todaysHabits.filter { $0.isCompleted(on: Date()) }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if habits.isEmpty {
                    emptyState
                } else {
                    VStack(spacing: 20) {
                        summaryCard
                        habitStatsList
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 32)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Statistics")
        }
    }

    // MARK: - Summary card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .font(.title2)
                    .foregroundStyle(Color.accent)
                Text("Today's Summary")
                    .font(.headline)
                Spacer()
            }

            HStack(spacing: 24) {
                StatBubble(
                    value: "\(completedToday)",
                    label: "Completed",
                    color: .green
                )
                StatBubble(
                    value: "\(todaysHabits.count)",
                    label: "Active",
                    color: Color.accent
                )
                StatBubble(
                    value: "\(todaysHabits.count - completedToday)",
                    label: "Remaining",
                    color: .orange
                )
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }

    // MARK: - Per-habit stats

    private var habitStatsList: some View {
        LazyVStack(spacing: 16) {
            ForEach(habits) { habit in
                HabitStatsCard(habit: habit)
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 56))
                .foregroundStyle(Color.accent.opacity(0.5))

            Text("No statistics yet")
                .font(.title3)
                .fontWeight(.semibold)

            Text("Complete some habits and your stats\nwill appear here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(60)
    }
}

// MARK: - Stat Bubble

struct StatBubble: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Per-Habit Stats Card

struct HabitStatsCard: View {
    let habit: Habit

    private var habitColor: Color {
        Color(hex: habit.colorHex)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(habitColor.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: habit.iconName)
                        .font(.body)
                        .foregroundStyle(habitColor)
                }

                Text(habit.name)
                    .font(.headline)

                Spacer()
            }

            // Stat row
            HStack(spacing: 0) {
                StatItem(
                    icon: "flame.fill",
                    value: "\(habit.currentStreak)",
                    label: "Current",
                    color: .orange
                )
                StatItem(
                    icon: "trophy.fill",
                    value: "\(habit.longestStreak)",
                    label: "Best",
                    color: .yellow
                )
                StatItem(
                    icon: "checkmark.circle.fill",
                    value: "\(habit.totalCompletions)",
                    label: "Total",
                    color: .green
                )
                StatItem(
                    icon: "percent",
                    value: "\(Int(habit.completionRate30Days * 100))%",
                    label: "30-day",
                    color: habitColor
                )
            }

            // Calendar grid (last 10 weeks)
            CalendarGrid(habit: habit)
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }
}

// MARK: - Stat Item

struct StatItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
            Text(value)
                .font(.system(.subheadline, design: .rounded, weight: .bold))
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Calendar Grid (10-week history)

struct CalendarGrid: View {
    let habit: Habit

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
    private let calendar = Calendar.current
    private let weekCount = 10

    /// The 70 days (10 weeks) ending on Saturday of the current week, or today.
    private var days: [Date] {
        let today = calendar.startOfDay(for: Date())

        // Find the most recent Sunday (start of week) to align the grid
        let weekday = calendar.component(.weekday, from: today) // 1=Sun
        let startOfWeek = calendar.date(byAdding: .day, value: -(weekday - 1), to: today)!

        // Go back (weekCount - 1) weeks from this Sunday
        let gridStart = calendar.date(byAdding: .weekOfYear, value: -(weekCount - 1), to: startOfWeek)!

        return (0..<(weekCount * 7)).compactMap {
            calendar.date(byAdding: .day, value: $0, to: gridStart)
        }
    }

    private var habitColor: Color {
        Color(hex: habit.colorHex)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Weekday headers
            HStack(spacing: 4) {
                ForEach(["S", "M", "T", "W", "T", "F", "S"], id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Day dots
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(days, id: \.self) { day in
                    let isToday = calendar.isDateInToday(day)
                    let isFuture = day > Date()
                    let isCompleted = habit.isCompleted(on: day)
                    let isScheduled = habit.isScheduled(for: day)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(dotColor(isCompleted: isCompleted, isScheduled: isScheduled, isFuture: isFuture))
                        .frame(height: 14)
                        .overlay {
                            if isToday {
                                RoundedRectangle(cornerRadius: 3)
                                    .stroke(habitColor, lineWidth: 1.5)
                            }
                        }
                }
            }
        }
    }

    private func dotColor(isCompleted: Bool, isScheduled: Bool, isFuture: Bool) -> Color {
        if isFuture {
            return Color(.systemGray6)
        }
        if isCompleted {
            return habitColor
        }
        if isScheduled {
            return habitColor.opacity(0.15)
        }
        return Color(.systemGray6)
    }
}

#Preview {
    StatsView()
        .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
