import SwiftUI

struct ScrapbookDetailView: View {
    @EnvironmentObject var store: ScrapbookStore
    let scrapbook: Scrapbook

    @State private var selectedPageIndex = 0
    @State private var showingInvite = false
    @State private var showingPrint = false
    @State private var showingPhotoPicker = false
    @State private var isEditing = false

    private var currentBook: Scrapbook {
        store.scrapbooks.first { $0.id == scrapbook.id } ?? scrapbook
    }

    var body: some View {
        VStack(spacing: 0) {
            // Page Tabs
            if currentBook.pages.count > 1 {
                pageTabBar
            }

            // Page Canvas
            if currentBook.pages.indices.contains(selectedPageIndex) {
                PageCanvasView(
                    page: currentBook.pages[selectedPageIndex],
                    bookId: currentBook.id,
                    isEditing: isEditing
                )
                .transition(.opacity)
                .id(currentBook.pages[selectedPageIndex].id)
            }
        }
        .navigationTitle(currentBook.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button {
                    showingPrint = true
                } label: {
                    Image(systemName: "printer")
                }

                Button {
                    showingInvite = true
                } label: {
                    Image(systemName: "person.badge.plus")
                }

                Button {
                    showingPhotoPicker = true
                } label: {
                    Image(systemName: "photo.badge.plus")
                }
            }

            ToolbarItemGroup(placement: .bottomBar) {
                Button {
                    store.addPage(to: currentBook.id)
                    selectedPageIndex = currentBook.pages.count - 1
                } label: {
                    Label("Add Page", systemImage: "plus.rectangle.on.rectangle")
                }

                Spacer()

                Button {
                    withAnimation { isEditing.toggle() }
                } label: {
                    Label(isEditing ? "Done" : "Edit", systemImage: isEditing ? "checkmark.circle.fill" : "pencil")
                        .foregroundStyle(isEditing ? .green : .pink)
                }
            }
        }
        .sheet(isPresented: $showingPhotoPicker) {
            if currentBook.pages.indices.contains(selectedPageIndex) {
                PhotoPickerView(pageId: currentBook.pages[selectedPageIndex].id, bookId: currentBook.id)
            }
        }
        .sheet(isPresented: $showingInvite) {
            InviteView(scrapbook: currentBook)
        }
        .sheet(isPresented: $showingPrint) {
            PrintPreviewView(scrapbook: currentBook)
        }
    }

    private var pageTabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(currentBook.pages.indices, id: \.self) { idx in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            selectedPageIndex = idx
                        }
                    } label: {
                        Text(currentBook.pages[idx].title)
                            .font(.caption.weight(selectedPageIndex == idx ? .semibold : .regular))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(selectedPageIndex == idx ? Color.pink : Color(.systemGray5))
                            .foregroundStyle(selectedPageIndex == idx ? .white : .primary)
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

#Preview {
    NavigationStack {
        ScrapbookDetailView(scrapbook: Scrapbook(title: "Test Book", ownerId: "user1"))
    }
    .environmentObject(ScrapbookStore())
}
