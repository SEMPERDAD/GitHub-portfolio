import Foundation
import UIKit

// MARK: - Scrapbook

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

// MARK: - ScrapbookPage

struct ScrapbookPage: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var items: [ScrapbookItem]
    var backgroundColor: String
    var backgroundPatternName: String?
    var createdAt: Date

    init(title: String) {
        self.title = title
        self.items = []
        self.backgroundColor = "#FFFDF7"
        self.createdAt = Date()
    }
}

// MARK: - ScrapbookItem

struct ScrapbookItem: Identifiable, Codable {
    var id: UUID = UUID()
    var type: ItemType
    var imageData: Data?
    var text: String?
    var positionX: Double
    var positionY: Double
    var width: Double
    var height: Double
    var rotation: Double
    var scale: Double
    var borderStyle: BorderStyle
    var caption: String?

    var image: UIImage? {
        guard let data = imageData else { return nil }
        return UIImage(data: data)
    }

    enum ItemType: String, Codable {
        case photo, text, sticker
    }

    enum BorderStyle: String, Codable {
        case none, polaroid, rounded, torn, tape
    }

    init(type: ItemType, positionX: Double = 0, positionY: Double = 0,
         width: Double = 200, height: Double = 200) {
        self.type = type
        self.positionX = positionX
        self.positionY = positionY
        self.width = width
        self.height = height
        self.rotation = Double.random(in: -8...8)
        self.scale = 1.0
        self.borderStyle = type == .photo ? .polaroid : .none
    }
}

// MARK: - ScrapbookUser

struct ScrapbookUser: Identifiable, Codable, Hashable {
    var id: String
    var displayName: String
    var email: String
    var avatarData: Data?
    var role: UserRole
    var joinedAt: Date

    enum UserRole: String, Codable {
        case owner, editor, viewer

        var displayName: String {
            switch self {
            case .owner:   return "Owner"
            case .editor:  return "Editor"
            case .viewer:  return "Viewer"
            }
        }
    }
}

// MARK: - InviteLink

struct InviteLink: Codable {
    var id: UUID = UUID()
    var scrapbookId: UUID
    var role: ScrapbookUser.UserRole
    var expiresAt: Date?
    var maxUses: Int?
    var useCount: Int = 0
    var createdAt: Date = Date()

    var shareURL: URL {
        URL(string: "scrapbook://invite/\(id.uuidString)")!
    }
}
