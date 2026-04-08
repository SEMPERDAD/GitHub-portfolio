import SwiftUI

struct ContentView: View {
    @StateObject private var store = HabitStore()
    @State private var showingAddHabit = false

    var body: some View {
        NavigationStack {
            Group {
                if store.habits.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "star.circle")
                            .font(.system(size: 64))
                            .foregroundColor(.gray.opacity(0.4))
                        Text("No habits yet")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Tap + to add your first habit")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(store.habits) { habit in
                            HabitRowView(habit: habit) {
                                store.toggleToday(for: habit)
                            }
                        }
                        .onDelete(perform: store.deleteHabit)
                    }
                }
            }
            .navigationTitle("My Habits")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddHabit = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddHabit) {
                AddHabitView(store: store)
            }
        }
    }
}
