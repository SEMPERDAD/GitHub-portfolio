import SwiftUI

/// Root view with tab-based navigation.
struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            TodayView()
                .tabItem {
                    Label("Today", systemImage: "sun.max.fill")
                }
                .tag(0)

            HabitsListView()
                .tabItem {
                    Label("Habits", systemImage: "list.bullet.circle.fill")
                }
                .tag(1)

            StatsView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar.fill")
                }
                .tag(2)
        }
        .tint(Color.accent)
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
