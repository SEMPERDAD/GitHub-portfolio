import Foundation
import UIKit

struct Scrapbook: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var coverImageData: Data?
    var pages: [ScrapbookPage]
    var collaborators: [ScrapbookUser]
    var createdAt: Date
    var updatedAt: Date
    var ownerId: String

    var coverImage: UIImage? {
        guard let data = coverImageData else { return nil }
        return UIImage(data: data)
    }

    init(title: String, ownerId: String) {
        self.title = title
        self.ownerId = ownerId
        self.pages = [ScrapbookPage(title: "Page 1")]
        self.collaborators = []
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}
