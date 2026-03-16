import SwiftUI

// MARK: - Color from hex string

extension Color {
    /// Initialise a Color from a CSS hex string, e.g. `"#FF2A64"` or `"FF2A64"`.
    init?(hex: String) {
        var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexStr.hasPrefix("#") { hexStr.removeFirst() }
        guard hexStr.count == 6, let hexVal = UInt64(hexStr, radix: 16) else { return nil }
        self.init(
            red:   Double((hexVal >> 16) & 0xFF) / 255,
            green: Double((hexVal >>  8) & 0xFF) / 255,
            blue:  Double( hexVal        & 0xFF) / 255
        )
    }
}
