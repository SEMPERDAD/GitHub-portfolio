import SwiftUI

@main
struct ScrapBookApp: App {
    @StateObject private var viewModel = ScrapbookViewModel()

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ProjectGalleryView()
            }
            .environmentObject(viewModel)
            .tint(.pink)
        }
    }
}
