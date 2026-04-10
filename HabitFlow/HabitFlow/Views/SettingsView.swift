import SwiftUI
import SwiftData

/// Settings screen accessible from the Today tab navigation bar.
struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @AppStorage("userName") private var userName: String = "Daniel"
    @AppStorage("appTheme") private var appTheme: String = "system"
    @State private var showResetAlert = false
    @State private var notificationsEnabled = false

    var body: some View {
        Form {
            profileSection
            appearanceSection
            notificationsSection
            dangerZoneSection
            aboutSection
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            checkNotificationStatus()
        }
        .alert("Reset All Data?", isPresented: $showResetAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Reset Everything", role: .destructive) {
                resetData()
            }
        } message: {
            Text("This will permanently delete all your habits and completion history. This cannot be undone.")
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        Section("Profile") {
            HStack {
                ZStack {
                    Circle()
                        .fill(Color.accent.opacity(0.15))
                        .frame(width: 50, height: 50)
                    Image(systemName: "person.fill")
                        .font(.title2)
                        .foregroundStyle(Color.accent)
                }
                TextField("Your name", text: $userName)
                    .textInputAutocapitalization(.words)
            }
        }
    }

    // MARK: - Appearance

    private var appearanceSection: some View {
        Section("Appearance") {
            Picker("Theme", selection: $appTheme) {
                Label("System", systemImage: "circle.lefthalf.filled")
                    .tag("system")
                Label("Light", systemImage: "sun.max.fill")
                    .tag("light")
                Label("Dark", systemImage: "moon.fill")
                    .tag("dark")
            }
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        Section {
            Toggle("Notifications", isOn: $notificationsEnabled)
                .onChange(of: notificationsEnabled) { _, newValue in
                    if newValue {
                        requestNotificationPermission()
                    }
                }
        } header: {
            Text("Notifications")
        } footer: {
            Text("Enable notifications to receive habit reminders at the times you set for each habit.")
        }
    }

    // MARK: - Danger zone

    private var dangerZoneSection: some View {
        Section {
            Button(role: .destructive) {
                showResetAlert = true
            } label: {
                HStack {
                    Image(systemName: "trash.fill")
                    Text("Reset All Data")
                }
            }
        } header: {
            Text("Danger Zone")
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        Section("About") {
            HStack {
                Text("Version")
                Spacer()
                Text("1.0.0")
                    .foregroundStyle(.secondary)
            }
            HStack {
                Text("Built with")
                Spacer()
                Text("SwiftUI + SwiftData")
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Actions

    private func checkNotificationStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                notificationsEnabled = settings.authorizationStatus == .authorized
            }
        }
    }

    private func requestNotificationPermission() {
        NotificationManager.shared.requestAuthorization { granted in
            DispatchQueue.main.async {
                notificationsEnabled = granted
            }
        }
    }

    private func resetData() {
        let vm = HabitViewModel(modelContext: modelContext)
        vm.resetAllData()
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
