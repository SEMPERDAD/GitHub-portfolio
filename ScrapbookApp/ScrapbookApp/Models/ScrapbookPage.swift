import Foundation
import UIKit

struct ScrapbookPage: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var items: [ScrapbookItem]
    var backgroundColor: String  // hex color string
    var backgroundPatternName: String?
    var createdAt: Date

    init(title: String) {
        self.title = title
        self.items = []
        self.backgroundColor = "#FFFDF7"
        self.createdAt = Date()
    }
}

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
        case photo
        case text
        case sticker
    }

    enum BorderStyle: String, Codable {
        case none
        case polaroid
        case rounded
        case torn
        case tape
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
