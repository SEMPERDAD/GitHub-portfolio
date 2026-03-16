import SwiftUI

struct PageTemplate: Identifiable {
    let id: String
    let name: String
    let aesthetic: String
    let emoji: String
    let backgroundColor: String
    let accentColor: Color
    let placeholderItems: [ScrapbookItem]

    func makePage(title: String) -> ScrapbookPage {
        var page = ScrapbookPage(title: title)
        page.backgroundColor = backgroundColor
        page.items = placeholderItems
        return page
    }
}

// MARK: - All templates

extension PageTemplate {
    static let all: [PageTemplate] = [
        travel, wedding, family, seasonal, minimal, collage, journal, freeform
    ]

    // Travel — Postcards, stamps, tilted polaroids
    static let travel = PageTemplate(
        id: "travel",
        name: "Travel",
        aesthetic: "Postcards & tilted polaroids",
        emoji: "✈️",
        backgroundColor: "#FFFDF7",
        accentColor: Color(red: 0.35, green: 0.68, blue: 0.88),
        placeholderItems: [
            photo(x: -20,  y:  -60, w: 195, h: 175, rot: -6),
            photo(x: 105,  y: -185, w: 118, h: 108, rot:  9),
            photo(x: -115, y:  145, w: 118, h: 106, rot: -7),
            txt(  x:  55,  y:  215),
        ]
    )

    // Wedding — Elegant florals, centered photos, script text
    static let wedding = PageTemplate(
        id: "wedding",
        name: "Wedding",
        aesthetic: "Elegant & romantic",
        emoji: "💍",
        backgroundColor: "#FFFCFA",
        accentColor: Color(red: 0.93, green: 0.70, blue: 0.78),
        placeholderItems: [
            photo(x:    0, y:  -70, w: 238, h: 265, rot:  0, border: .none),
            photo(x: -118, y:  168, w: 132, h: 112, rot: -3, border: .none),
            photo(x:  112, y:  170, w: 132, h: 112, rot:  3, border: .none),
            txt(  x:    0, y:   75),
        ]
    )

    // Family — 4-photo grid, handwritten captions
    static let family = PageTemplate(
        id: "family",
        name: "Family",
        aesthetic: "4-photo grid & captions",
        emoji: "🏡",
        backgroundColor: "#FFFDF7",
        accentColor: Color(red: 1.0, green: 0.72, blue: 0.40),
        placeholderItems: [
            photo(x: -99, y: -125, w: 155, h: 140, rot: -3),
            photo(x:  88, y: -125, w: 155, h: 140, rot:  4),
            photo(x: -99, y:   80, w: 155, h: 140, rot:  2),
            photo(x:  88, y:   80, w: 155, h: 140, rot: -5),
        ]
    )

    // Seasonal — Overlapping collage, leaf decoratives
    static let seasonal = PageTemplate(
        id: "seasonal",
        name: "Seasonal",
        aesthetic: "Overlapping collage & leaves",
        emoji: "🍂",
        backgroundColor: "#FFF5EB",
        accentColor: Color(red: 0.88, green: 0.52, blue: 0.22),
        placeholderItems: [
            photo(   x:   5, y:  -45, w: 208, h: 188, rot:  -4),
            photo(   x: -90, y:  115, w: 152, h: 136, rot:  -8),
            photo(   x:  85, y:  125, w: 148, h: 130, rot:  10),
            sticker("🍂", x: 148, y: -190),
            sticker("🍁", x: -155, y: -172),
        ]
    )

    // Minimal — Clean lines, generous white space
    static let minimal = PageTemplate(
        id: "minimal",
        name: "Minimal",
        aesthetic: "Clean lines & white space",
        emoji: "◻️",
        backgroundColor: "#FFFFFF",
        accentColor: Color(red: 0.22, green: 0.22, blue: 0.24),
        placeholderItems: [
            photo(x: 0, y: -30, w: 278, h: 248, rot: 0, border: .rounded),
            txt(  x: 0, y: 198),
        ]
    )

    // Collage — 6 overlapping photos, magazine style
    static let collage = PageTemplate(
        id: "collage",
        name: "Collage",
        aesthetic: "Bold & dynamic",
        emoji: "🎞️",
        backgroundColor: "#FFFDF7",
        accentColor: Color(red: 0.70, green: 0.38, blue: 0.82),
        placeholderItems: [
            photo(x:  -82, y: -162, w: 162, h: 146, rot: -12),
            photo(x:   82, y: -152, w: 152, h: 136, rot:   9),
            photo(x: -112, y:   12, w: 156, h: 140, rot:  -5),
            photo(x:   92, y:   16, w: 160, h: 145, rot:  14),
            photo(x:   -5, y:  172, w: 188, h: 165, rot:  -2),
        ]
    )

    // Journal — Text-heavy with photo accents
    static let journal = PageTemplate(
        id: "journal",
        name: "Journal",
        aesthetic: "Diary & notebook feel",
        emoji: "📓",
        backgroundColor: "#FFFEF5",
        accentColor: Color(red: 0.42, green: 0.60, blue: 0.38),
        placeholderItems: [
            txt(  x:  -10, y: -228),
            photo(x: -112, y:  -98, w: 130, h: 118, rot: -5),
            txt(  x:   55, y:  -78),
            photo(x:  108, y:   58, w: 128, h: 116, rot:  7),
            txt(  x:  -60, y:  222),
        ]
    )

    // Freeform — Blank canvas
    static let freeform = PageTemplate(
        id: "freeform",
        name: "Freeform",
        aesthetic: "Complete freedom",
        emoji: "✨",
        backgroundColor: "#FFFDF7",
        accentColor: Color(red: 1.0, green: 0.47, blue: 0.62),
        placeholderItems: []
    )

    // MARK: - Item helpers

    private static func photo(
        x: Double, y: Double, w: Double, h: Double,
        rot: Double? = nil,
        border: ScrapbookItem.BorderStyle = .polaroid
    ) -> ScrapbookItem {
        var item = ScrapbookItem(type: .photo, positionX: x, positionY: y, width: w, height: h)
        item.rotation = rot ?? Double.random(in: -5...5)
        item.borderStyle = border
        return item
    }

    private static func txt(x: Double, y: Double) -> ScrapbookItem {
        var item = ScrapbookItem(type: .text, positionX: x, positionY: y, width: 180, height: 40)
        item.text = "Add text here"
        item.rotation = 0
        return item
    }

    private static func sticker(_ emoji: String, x: Double, y: Double) -> ScrapbookItem {
        var item = ScrapbookItem(type: .sticker, positionX: x, positionY: y, width: 40, height: 40)
        item.text = emoji
        item.rotation = 0
        return item
    }
}
