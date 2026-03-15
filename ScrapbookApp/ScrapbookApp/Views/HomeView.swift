import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: ScrapbookStore
    @State private var showingNewBook = false
    @State private var newTitle = ""
    @State private var searchText = ""

    var filteredBooks: [Scrapbook] {
        if searchText.isEmpty { return store.scrapbooks }
        return store.scrapbooks.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        Group {
            if store.scrapbooks.isEmpty {
                emptyState
            } else {
                scrollContent
            }
        }
        .navigationTitle("My Scrapbooks")
        .searchable(text: $searchText, prompt: "Search scrapbooks")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showingNewBook = true
                } label: {
                    Image(systemName: "plus")
                        .fontWeight(.semibold)
                }
            }
        }
        .alert("New Scrapbook", isPresented: $showingNewBook) {
            TextField("Title", text: $newTitle)
            Button("Create") {
                if !newTitle.trimmingCharacters(in: .whitespaces).isEmpty {
                    _ = store.createScrapbook(title: newTitle)
                    newTitle = ""
                }
            }
            Button("Cancel", role: .cancel) { newTitle = "" }
        }
    }

    private var scrollContent: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ForEach(filteredBooks) { book in
                    NavigationLink(destination: ScrapbookDetailView(scrapbook: book)) {
                        ScrapbookCard(scrapbook: book)
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button(role: .destructive) {
                            store.deleteScrapbook(book)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "photo.stack")
                .font(.system(size: 64))
                .foregroundStyle(.pink.opacity(0.7))
            Text("No Scrapbooks Yet")
                .font(.title2.weight(.semibold))
            Text("Tap + to create your first scrapbook")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button("Create Scrapbook") {
                showingNewBook = true
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

struct ScrapbookCard: View {
    let scrapbook: Scrapbook

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.pink.opacity(0.3), .purple.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 160)

                if let cover = scrapbook.coverImage {
                    Image(uiImage: cover)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 160)
                        .clipped()
                } else {
                    Image(systemName: "photo.stack.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(scrapbook.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                HStack {
                    Text("\(scrapbook.pages.count) page\(scrapbook.pages.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !scrapbook.collaborators.isEmpty {
                        Spacer()
                        Image(systemName: "person.2.fill")
                            .font(.caption)
                            .foregroundStyle(.pink)
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
    .environmentObject(ScrapbookStore())
}
