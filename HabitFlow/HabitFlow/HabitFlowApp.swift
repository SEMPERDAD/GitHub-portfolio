import SwiftUI
import SwiftData

/// HabitFlow — A beautiful habit tracking app built with SwiftUI and SwiftData.
@main
struct HabitFlowApp: App {
    @AppStorage("hasLaunchedBefore") private var hasLaunchedBefore = false
    @AppStorage("appTheme") private var appTheme: String = "system"

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([Habit.self, HabitEntry.self])
        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false
        )
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(sharedModelContainer)
                .preferredColorScheme(colorScheme)
                .onAppear {
                    seedDataIfNeeded()
                }
        }
    }

    private var colorScheme: ColorScheme? {
        switch appTheme {
        case "light": return .light
        case "dark": return .dark
        default: return nil
        }
    }

    /// Seeds starter habits on first launch.
    private func seedDataIfNeeded() {
        guard !hasLaunchedBefore else { return }
        hasLaunchedBefore = true

        let context = sharedModelContainer.mainContext

        let starterHabits: [(String, String, String)] = [
            ("Morning Workout", "figure.run", "#1A8C7A"),
            ("Read 20 Minutes", "book.fill", "#3F51B5"),
            ("Drink Water", "drop.fill", "#2196F3")
        ]

        for (name, icon, color) in starterHabits {
            let habit = Habit(
                name: name,
                iconName: icon,
                colorHex: color,
                frequency: .daily,
                reminderTime: nil
            )
            context.insert(habit)
        }

        try? context.save()
    }
}
