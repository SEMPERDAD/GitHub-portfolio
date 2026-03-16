import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: ScrapbookStore
    @State private var showingNewBook = false
    @State private var newTitle = ""
    @State private var searchText = ""

    var filteredBooks: [Scrapbook] {
        searchText.isEmpty
            ? store.scrapbooks
            : store.scrapbooks.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            if store.scrapbooks.isEmpty && searchText.isEmpty {
                emptyState
            } else {
                scrollContent
            }

            // Floating action button
            Button { showingNewBook = true } label: {
                Image(systemName: "plus")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 58, height: 58)
                    .background(
                        LinearGradient(
                            colors: [
                                Color(red: 1.0, green: 0.47, blue: 0.62),
                                Color(red: 0.90, green: 0.24, blue: 0.48)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
                    .shadow(
                        color: Color(red: 1.0, green: 0.30, blue: 0.52).opacity(0.42),
                        radius: 14, x: 0, y: 6
                    )
            }
            .padding(.trailing, 24)
            .padding(.bottom, 28)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 9) {
                    ScrapbookLogoView(size: 30)
                    Text("Scrapbook")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.primary)
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search scrapbooks...")
        .alert("New Scrapbook", isPresented: $showingNewBook) {
            TextField("Give it a name...", text: $newTitle)
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
            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 16
            ) {
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
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 100)
        }
        .background(Color(red: 0.99, green: 0.97, blue: 0.95))
    }

    private var emptyState: some View {
        VStack(spacing: 0) {
            Spacer()

            ScrapbookLogoView(size: 110)
                .padding(.bottom, 28)

            Text("No Scrapbooks Yet")
                .font(.title2.weight(.bold))
                .padding(.bottom, 8)

            Text("Tap the button below to create\nyour first scrapbook")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(Color(red: 0.99, green: 0.97, blue: 0.95))
    }
}

// MARK: - Card

private let cardDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "MMM d"
    return f
}()

struct ScrapbookCard: View {
    let scrapbook: Scrapbook

    private var coverGradient: LinearGradient {
        let palettes: [[Color]] = [
            [Color(red: 1.00, green: 0.78, blue: 0.82), Color(red: 0.97, green: 0.62, blue: 0.72)], // rose
            [Color(red: 0.86, green: 0.79, blue: 0.97), Color(red: 0.74, green: 0.62, blue: 0.92)], // lavender
            [Color(red: 1.00, green: 0.89, blue: 0.72), Color(red: 1.00, green: 0.76, blue: 0.58)], // peach
            [Color(red: 0.76, green: 0.92, blue: 0.89), Color(red: 0.60, green: 0.84, blue: 0.84)], // mint
        ]
        let index = abs(scrapbook.title.hashValue) % palettes.count
        return LinearGradient(
            colors: palettes[index],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                coverGradient
                    .frame(height: 170)

                if let cover = scrapbook.coverImage {
                    Image(uiImage: cover)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 170)
                        .clipped()
                } else {
                    Image(systemName: "photo.stack.fill")
                        .font(.system(size: 38))
                        .foregroundStyle(.white.opacity(0.65))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(scrapbook.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                    .foregroundStyle(.primary)

                HStack(spacing: 0) {
                    Text(cardDateFormatter.string(from: scrapbook.updatedAt))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text("  ·  \(scrapbook.pages.count) pg")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if !scrapbook.collaborators.isEmpty {
                        Image(systemName: "person.2.fill")
                            .font(.caption2)
                            .foregroundStyle(Color(red: 0.90, green: 0.24, blue: 0.48))
                    }
                }
            }
            .padding(.horizontal, 9)
            .padding(.vertical, 9)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .shadow(
            color: Color(red: 0.6, green: 0.4, blue: 0.5).opacity(0.10),
            radius: 8, x: 0, y: 4
        )
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
    .environmentObject(ScrapbookStore())
}
