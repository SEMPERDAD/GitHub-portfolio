import SwiftUI

struct ScrapbookEditorView: View {
    @EnvironmentObject var viewModel: ScrapbookViewModel
    let scrapbook: Scrapbook

    @State private var selectedPageIndex = 0
    @State private var showingCollaboration = false
    @State private var showingPrint = false
    @State private var showingPhotoPicker = false
    @State private var showingTemplatePicker = false
    @State private var isEditing = false

    private var currentBook: Scrapbook {
        viewModel.scrapbooks.first { $0.id == scrapbook.id } ?? scrapbook
    }

    var body: some View {
        VStack(spacing: 0) {
            if currentBook.pages.count > 1 {
                PageNavigatorView(pages: currentBook.pages, selectedIndex: $selectedPageIndex) { idx in
                    let page = currentBook.pages[idx]
                    viewModel.deletePage(page, from: currentBook.id)
                    if selectedPageIndex >= currentBook.pages.count - 1 {
                        selectedPageIndex = max(0, currentBook.pages.count - 2)
                    }
                }
            }

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
                Button { showingPrint = true } label: {
                    Image(systemName: "printer")
                }
                Button { showingCollaboration = true } label: {
                    Image(systemName: "person.badge.plus")
                }
                Button { showingPhotoPicker = true } label: {
                    Image(systemName: "photo.badge.plus")
                }
            }

            ToolbarItemGroup(placement: .bottomBar) {
                Button { showingTemplatePicker = true } label: {
                    Label("Add Page", systemImage: "plus.rectangle.on.rectangle")
                }
                Spacer()
                Button {
                    withAnimation { isEditing.toggle() }
                } label: {
                    Label(isEditing ? "Done" : "Edit",
                          systemImage: isEditing ? "checkmark.circle.fill" : "pencil")
                        .foregroundStyle(isEditing ? .green : .pink)
                }
            }
        }
        .sheet(isPresented: $showingPhotoPicker) {
            if currentBook.pages.indices.contains(selectedPageIndex) {
                PhotoPickerView(
                    pageId: currentBook.pages[selectedPageIndex].id,
                    bookId: currentBook.id
                )
            }
        }
        .sheet(isPresented: $showingTemplatePicker) {
            TemplatePickerView { template in
                viewModel.addPage(to: currentBook.id, template: template)
                selectedPageIndex = currentBook.pages.count - 1
            }
            .presentationDetents([.large])
        }
        .sheet(isPresented: $showingCollaboration) {
            CollaborationPanelView(scrapbook: currentBook)
        }
        .sheet(isPresented: $showingPrint) {
            PrintPreviewView(scrapbook: currentBook)
        }
    }
}

#Preview {
    NavigationStack {
        ScrapbookEditorView(scrapbook: Scrapbook(title: "Test Book", ownerId: "user1"))
    }
    .environmentObject(ScrapbookViewModel())
}
