import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            JobsView()
                .tabItem {
                    Label("Jobs", systemImage: "briefcase.fill")
                }

            BulkApplyView()
                .tabItem {
                    Label("Apply", systemImage: "paperplane.fill")
                }

            ApplicationsView()
                .tabItem {
                    Label("Tracker", systemImage: "list.clipboard.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
        .tint(Brand.violet)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppStore())
}
