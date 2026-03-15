import Foundation

struct ScrapbookUser: Identifiable, Codable, Hashable {
    var id: String
    var displayName: String
    var email: String
    var avatarData: Data?
    var role: UserRole
    var joinedAt: Date

    enum UserRole: String, Codable {
        case owner
        case editor
        case viewer

        var displayName: String {
            switch self {
            case .owner: return "Owner"
            case .editor: return "Can Edit"
            case .viewer: return "Can View"
            }
        }
    }
}

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
