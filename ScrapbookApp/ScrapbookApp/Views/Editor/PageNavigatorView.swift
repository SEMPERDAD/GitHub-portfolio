import SwiftUI

/// Horizontal scrolling page-tab strip shown at the top of the editor.
struct PageNavigatorView: View {
    let pages: [ScrapbookPage]
    @Binding var selectedIndex: Int

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(pages.indices, id: \.self) { idx in
                    Button {
                        withAnimation(.spring(response: 0.3)) { selectedIndex = idx }
                    } label: {
                        Text(pages[idx].title)
                            .font(.caption.weight(selectedIndex == idx ? .semibold : .regular))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(selectedIndex == idx ? Color.pink : Color(.systemGray5))
                            .foregroundStyle(selectedIndex == idx ? .white : .primary)
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
    let pages = [ScrapbookPage(title: "Page 1"), ScrapbookPage(title: "Page 2")]
    PageNavigatorView(pages: pages, selectedIndex: .constant(0))
}
