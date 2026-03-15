import Foundation
import UIKit
import Combine

@MainActor
class ScrapbookStore: ObservableObject {
    @Published var scrapbooks: [Scrapbook] = []
    @Published var currentUser: ScrapbookUser

    private let saveKey = "saved_scrapbooks"

    init() {
        self.currentUser = ScrapbookUser(
            id: UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString,
            displayName: UIDevice.current.name,
            email: "",
            role: .owner,
            joinedAt: Date()
        )
        loadScrapbooks()
        if scrapbooks.isEmpty {
            let sample = Scrapbook(title: "My First Scrapbook", ownerId: currentUser.id)
            scrapbooks.append(sample)
            saveScrapbooks()
        }
    }

    // MARK: - CRUD

    func createScrapbook(title: String) -> Scrapbook {
        let book = Scrapbook(title: title, ownerId: currentUser.id)
        scrapbooks.insert(book, at: 0)
        saveScrapbooks()
        return book
    }

    func updateScrapbook(_ updated: Scrapbook) {
        guard let idx = scrapbooks.firstIndex(where: { $0.id == updated.id }) else { return }
        scrapbooks[idx] = updated
        saveScrapbooks()
    }

    func deleteScrapbook(_ book: Scrapbook) {
        scrapbooks.removeAll { $0.id == book.id }
        saveScrapbooks()
    }

    func addPage(to bookId: UUID) {
        guard let idx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        let pageNumber = scrapbooks[idx].pages.count + 1
        scrapbooks[idx].pages.append(ScrapbookPage(title: "Page \(pageNumber)"))
        scrapbooks[idx].updatedAt = Date()
        saveScrapbooks()
    }

    func deletePage(_ page: ScrapbookPage, from bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        scrapbooks[bookIdx].pages.removeAll { $0.id == page.id }
        saveScrapbooks()
    }

    func addPhoto(_ image: UIImage, to pageId: UUID, in bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }),
              let pageIdx = scrapbooks[bookIdx].pages.firstIndex(where: { $0.id == pageId })
        else { return }

        var item = ScrapbookItem(
            type: .photo,
            positionX: Double.random(in: 20...180),
            positionY: Double.random(in: 20...300),
            width: 220,
            height: 220
        )
        item.imageData = image.jpegData(compressionQuality: 0.8)
        scrapbooks[bookIdx].pages[pageIdx].items.append(item)
        scrapbooks[bookIdx].updatedAt = Date()

        if scrapbooks[bookIdx].coverImageData == nil {
            scrapbooks[bookIdx].coverImageData = item.imageData
        }
        saveScrapbooks()
    }

    func updateItem(_ item: ScrapbookItem, on pageId: UUID, in bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }),
              let pageIdx = scrapbooks[bookIdx].pages.firstIndex(where: { $0.id == pageId }),
              let itemIdx = scrapbooks[bookIdx].pages[pageIdx].items.firstIndex(where: { $0.id == item.id })
        else { return }
        scrapbooks[bookIdx].pages[pageIdx].items[itemIdx] = item
        saveScrapbooks()
    }

    func deleteItem(_ item: ScrapbookItem, from pageId: UUID, in bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }),
              let pageIdx = scrapbooks[bookIdx].pages.firstIndex(where: { $0.id == pageId })
        else { return }
        scrapbooks[bookIdx].pages[pageIdx].items.removeAll { $0.id == item.id }
        saveScrapbooks()
    }

    // MARK: - Collaborators

    func inviteCollaborator(email: String, role: ScrapbookUser.UserRole, to bookId: UUID) -> InviteLink {
        let link = InviteLink(scrapbookId: bookId, role: role, expiresAt: Date().addingTimeInterval(7 * 86400))
        return link
    }

    func removeCollaborator(_ user: ScrapbookUser, from bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        scrapbooks[bookIdx].collaborators.removeAll { $0.id == user.id }
        saveScrapbooks()
    }

    // MARK: - Persistence

    private func saveScrapbooks() {
        if let data = try? JSONEncoder().encode(scrapbooks) {
            UserDefaults.standard.set(data, forKey: saveKey)
        }
    }

    private func loadScrapbooks() {
        guard let data = UserDefaults.standard.data(forKey: saveKey),
              let decoded = try? JSONDecoder().decode([Scrapbook].self, from: data)
        else { return }
        scrapbooks = decoded
    }
}
