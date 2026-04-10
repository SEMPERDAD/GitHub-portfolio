import SwiftUI
import SwiftData

/// The main "Today" tab showing daily progress and habit cards.
struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var allHabits: [Habit]
    @AppStorage("userName") private var userName: String = "Daniel"
    @State private var animatingHabitId: UUID?

    private var todaysHabits: [Habit] {
        allHabits.filter { $0.isScheduled(for: Date()) }
    }

    private var completedCount: Int {
        todaysHabits.filter { $0.isCompleted(on: Date()) }.count
    }

    private var progress: Double {
        guard !todaysHabits.isEmpty else { return 0 }
        return Double(completedCount) / Double(todaysHabits.count)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    headerSection
                    progressSection

                    if todaysHabits.isEmpty {
                        emptyState
                    } else {
                        habitsSection
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Today")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: SettingsView()) {
                        Image(systemName: "gearshape.fill")
                            .foregroundStyle(Color.accent)
                    }
                }
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(greeting)
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Hello, \(userName)")
                .font(.largeTitle)
                .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning ☀️"
        case 12..<17: return "Good afternoon"
        case 17..<21: return "Good evening"
        default: return "Good night"
        }
    }

    // MARK: - Progress ring

    private var progressSection: some View {
        VStack(spacing: 12) {
            ZStack {
                // Background track
                Circle()
                    .stroke(Color.accent.opacity(0.15), lineWidth: 14)

                // Progress arc
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        Color.accent,
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: progress)

                // Center label
                VStack(spacing: 2) {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .contentTransition(.numericText())
                    Text("\(completedCount)/\(todaysHabits.count) done")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 150, height: 150)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Habit cards

    private var habitsSection: some View {
        LazyVStack(spacing: 12) {
            ForEach(todaysHabits) { habit in
                HabitCardView(
                    habit: habit,
                    isAnimating: animatingHabitId == habit.id,
                    onToggle: {
                        toggleHabit(habit)
                    }
                )
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "leaf.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color.accent.opacity(0.5))

            Text("No habits for today")
                .font(.title3)
                .fontWeight(.semibold)

            Text("Add your first habit to get started on your journey.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            NavigationLink(destination: AddHabitView()) {
                Label("Add Habit", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.accent, in: Capsule())
            }
        }
        .padding(40)
    }

    // MARK: - Actions

    private func toggleHabit(_ habit: Habit) {
        let isCompleting = !habit.isCompleted(on: Date())

        if isCompleting {
            // Trigger haptic
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()

            // Animation state
            withAnimation(.spring(response: 0.35, dampingFraction: 0.5)) {
                animatingHabitId = habit.id
            }

            // Reset animation after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                withAnimation {
                    animatingHabitId = nil
                }
            }
        }

        // Toggle in data
        let vm = HabitViewModel(modelContext: modelContext)
        vm.toggleCompletion(for: habit)
    }
}

// MARK: - Habit Card Component

struct HabitCardView: View {
    let habit: Habit
    let isAnimating: Bool
    let onToggle: () -> Void

    private var isCompleted: Bool {
        habit.isCompleted(on: Date())
    }

    private var habitColor: Color {
        Color(hex: habit.colorHex)
    }

    var body: some View {
        HStack(spacing: 16) {
            // Icon with progress ring
            ZStack {
                Circle()
                    .fill(habitColor.opacity(0.15))
                    .frame(width: 50, height: 50)

                Image(systemName: habit.iconName)
                    .font(.title2)
                    .foregroundStyle(habitColor)
            }

            // Name and streak
            VStack(alignment: .leading, spacing: 4) {
                Text(habit.name)
                    .font(.headline)
                    .strikethrough(isCompleted, color: .secondary)
                    .foregroundStyle(isCompleted ? .secondary : .primary)

                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                    Text("\(habit.currentStreak) day streak")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Checkmark button
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .strokeBorder(isCompleted ? habitColor : Color(.systemGray3), lineWidth: 2.5)
                        .frame(width: 36, height: 36)

                    if isCompleted {
                        Circle()
                            .fill(habitColor)
                            .frame(width: 36, height: 36)

                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .scaleEffect(isAnimating ? 1.3 : 1.0)
            .animation(.spring(response: 0.35, dampingFraction: 0.5), value: isAnimating)
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }
}

#Preview {
    TodayView()
        .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
