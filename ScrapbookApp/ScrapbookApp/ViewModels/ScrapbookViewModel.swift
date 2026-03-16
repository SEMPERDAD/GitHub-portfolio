import Foundation
import UIKit

/// Central MVVM orchestrator. Owns all scrapbook state and coordinates
/// PersistenceService, CollaborationService, AirDropService, and PrintService.
@MainActor
class ScrapbookViewModel: ObservableObject {

    // MARK: - Published state

    @Published var scrapbooks: [Scrapbook] = []
    @Published var currentUser: ScrapbookUser

    // MARK: - Services

    private let persistence = PersistenceService()
    let collaboration = CollaborationService()
    let airdrop = AirDropService()
    let printer = PrintService()

    // MARK: - Init

    init() {
        self.currentUser = ScrapbookUser(
            id: UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString,
            displayName: UIDevice.current.name,
            email: "",
            role: .owner,
            joinedAt: Date()
        )
        scrapbooks = persistence.load()
        if scrapbooks.isEmpty {
            scrapbooks.append(Scrapbook(title: "My First Scrapbook", ownerId: currentUser.id))
            persistence.save(scrapbooks)
        }

        // Receive collaborative changes from nearby peers
        collaboration.onDataReceived = { [weak self] data, _ in
            guard let self,
                  let updated = try? JSONDecoder().decode(Scrapbook.self, from: data),
                  let idx = self.scrapbooks.firstIndex(where: { $0.id == updated.id })
            else { return }
            self.scrapbooks[idx] = updated
            self.persistence.save(self.scrapbooks)
        }
    }

    // MARK: - Scrapbooks

    func createScrapbook(title: String) -> Scrapbook {
        let book = Scrapbook(title: title, ownerId: currentUser.id)
        scrapbooks.insert(book, at: 0)
        persistence.save(scrapbooks)
        return book
    }

    func updateScrapbook(_ updated: Scrapbook) {
        guard let idx = scrapbooks.firstIndex(where: { $0.id == updated.id }) else { return }
        scrapbooks[idx] = updated
        persistence.save(scrapbooks)
        collaboration.sendScrapbook(updated)
    }

    func deleteScrapbook(_ book: Scrapbook) {
        scrapbooks.removeAll { $0.id == book.id }
        persistence.save(scrapbooks)
    }

    // MARK: - Pages

    func addPage(to bookId: UUID) {
        guard let idx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        let pageNumber = scrapbooks[idx].pages.count + 1
        scrapbooks[idx].pages.append(ScrapbookPage(title: "Page \(pageNumber)"))
        scrapbooks[idx].updatedAt = Date()
        persistence.save(scrapbooks)
    }

    func addPage(to bookId: UUID, template: PageTemplate) {
        guard let idx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        let pageNumber = scrapbooks[idx].pages.count + 1
        scrapbooks[idx].pages.append(template.makePage(title: "Page \(pageNumber)"))
        scrapbooks[idx].updatedAt = Date()
        persistence.save(scrapbooks)
    }

    func deletePage(_ page: ScrapbookPage, from bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        scrapbooks[bookIdx].pages.removeAll { $0.id == page.id }
        persistence.save(scrapbooks)
    }

    // MARK: - Photos & items

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
        persistence.save(scrapbooks)
    }

    func updateItem(_ item: ScrapbookItem, on pageId: UUID, in bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }),
              let pageIdx = scrapbooks[bookIdx].pages.firstIndex(where: { $0.id == pageId }),
              let itemIdx = scrapbooks[bookIdx].pages[pageIdx].items.firstIndex(where: { $0.id == item.id })
        else { return }
        scrapbooks[bookIdx].pages[pageIdx].items[itemIdx] = item
        persistence.save(scrapbooks)
    }

    func deleteItem(_ item: ScrapbookItem, from pageId: UUID, in bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }),
              let pageIdx = scrapbooks[bookIdx].pages.firstIndex(where: { $0.id == pageId })
        else { return }
        scrapbooks[bookIdx].pages[pageIdx].items.removeAll { $0.id == item.id }
        persistence.save(scrapbooks)
    }

    // MARK: - Collaborators

    func inviteCollaborator(email: String, role: ScrapbookUser.UserRole, to bookId: UUID) -> InviteLink {
        InviteLink(scrapbookId: bookId, role: role, expiresAt: Date().addingTimeInterval(7 * 86400))
    }

    func removeCollaborator(_ user: ScrapbookUser, from bookId: UUID) {
        guard let bookIdx = scrapbooks.firstIndex(where: { $0.id == bookId }) else { return }
        scrapbooks[bookIdx].collaborators.removeAll { $0.id == user.id }
        persistence.save(scrapbooks)
    }
}
