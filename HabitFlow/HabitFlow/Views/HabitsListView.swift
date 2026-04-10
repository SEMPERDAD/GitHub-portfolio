import SwiftUI
import SwiftData

/// The "Habits" tab for managing all habits.
struct HabitsListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @State private var showingAddSheet = false
    @State private var habitToDelete: Habit?
    @State private var showDeleteAlert = false

    var body: some View {
        NavigationStack {
            Group {
                if habits.isEmpty {
                    emptyState
                } else {
                    habitsList
                }
            }
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddSheet = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Color.accent)
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddHabitView()
            }
            .alert("Delete Habit?", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {
                    habitToDelete = nil
                }
                Button("Delete", role: .destructive) {
                    if let habit = habitToDelete {
                        let vm = HabitViewModel(modelContext: modelContext)
                        vm.deleteHabit(habit)
                    }
                    habitToDelete = nil
                }
            } message: {
                if let habit = habitToDelete {
                    Text("Are you sure you want to delete \"\(habit.name)\"? This will remove all completion history.")
                }
            }
        }
    }

    // MARK: - Habits list

    private var habitsList: some View {
        List {
            ForEach(habits) { habit in
                NavigationLink(destination: EditHabitView(habit: habit)) {
                    HabitRowView(habit: habit)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
            }
            .onDelete(perform: confirmDelete)
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 56))
                .foregroundStyle(Color.accent.opacity(0.5))

            Text("No habits yet")
                .font(.title3)
                .fontWeight(.semibold)

            Text("Create your first habit and start building\nbetter routines today.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingAddSheet = true }) {
                Label("Create Habit", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.accent, in: Capsule())
            }
        }
        .padding(40)
    }

    // MARK: - Delete

    private func confirmDelete(at offsets: IndexSet) {
        if let index = offsets.first {
            habitToDelete = habits[index]
            showDeleteAlert = true
        }
    }
}

// MARK: - Habit Row

struct HabitRowView: View {
    let habit: Habit

    private var habitColor: Color {
        Color(hex: habit.colorHex)
    }

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(habitColor.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: habit.iconName)
                    .font(.title3)
                    .foregroundStyle(habitColor)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(habit.name)
                    .font(.headline)
                Text(frequencyLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                    Text("\(habit.currentStreak)")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                Text("streak")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var frequencyLabel: String {
        switch habit.frequency {
        case .daily:
            return "Every day"
        case .specificDays(let days):
            return DateHelper.weekdayNames(for: days)
        case .timesPerWeek(let count):
            return "\(count)× per week"
        }
    }
}

#Preview {
    HabitsListView()
        .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
