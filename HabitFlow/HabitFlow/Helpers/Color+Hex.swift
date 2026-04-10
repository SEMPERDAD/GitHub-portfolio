import SwiftUI

extension Color {
    /// Initialize a Color from a hex string like "#1A8C7A" or "1A8C7A".
    init(hex: String) {
        let sanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&rgb)

        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >> 8) & 0xFF) / 255.0
        let b = Double(rgb & 0xFF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}

/// Preset color palette for habit customization.
enum ColorPalette {
    static let presets: [String] = [
        "#1A8C7A",  // Teal (primary)
        "#3F51B5",  // Indigo
        "#2196F3",  // Blue
        "#9C27B0",  // Purple
        "#E91E63",  // Pink
        "#FF5722",  // Deep Orange
        "#FF9800",  // Orange
        "#4CAF50",  // Green
    ]
}
