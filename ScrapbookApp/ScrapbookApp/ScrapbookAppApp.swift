import SwiftUI

@main
struct ScrapbookAppApp: App {
    @StateObject private var store = ScrapbookStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
