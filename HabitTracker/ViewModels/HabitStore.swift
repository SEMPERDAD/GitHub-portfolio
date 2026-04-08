import Foundation

class HabitStore: ObservableObject {
    @Published var habits: [Habit] = [] {
        didSet {
            save()
        }
    }

    private let saveKey = "HabitTrackerHabits"

    init() {
        load()
    }

    func addHabit(name: String) {
        let habit = Habit(name: name)
        habits.append(habit)
    }

    func deleteHabit(at offsets: IndexSet) {
        habits.remove(atOffsets: offsets)
    }

    func toggleToday(for habit: Habit) {
        guard let index = habits.firstIndex(where: { $0.id == habit.id }) else { return }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayString = formatter.string(from: Date())

        if let dateIndex = habits[index].completedDates.firstIndex(of: todayString) {
            habits[index].completedDates.remove(at: dateIndex)
        } else {
            habits[index].completedDates.append(todayString)
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(habits) {
            UserDefaults.standard.set(data, forKey: saveKey)
        }
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: saveKey),
           let decoded = try? JSONDecoder().decode([Habit].self, from: data) {
            habits = decoded
        }
    }
}
