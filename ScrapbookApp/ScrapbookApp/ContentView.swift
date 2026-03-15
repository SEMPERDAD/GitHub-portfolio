import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: ScrapbookStore

    var body: some View {
        NavigationStack {
            HomeView()
        }
        .tint(.pink)
    }
}

#Preview {
    ContentView()
        .environmentObject(ScrapbookStore())
}
