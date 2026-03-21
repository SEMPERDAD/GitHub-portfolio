import SwiftUI

// MARK: - Brand Palette

enum Brand {
    /// Primary violet  #6C3AE8
    static let violet  = Color(red: 0.424, green: 0.227, blue: 0.910)
    /// Deep indigo     #3D49EE
    static let indigo  = Color(red: 0.239, green: 0.286, blue: 0.933)
    /// Electric cyan   #00C1FA
    static let cyan    = Color(red: 0.000, green: 0.757, blue: 0.980)
    /// Emerald green   #0DCC99
    static let emerald = Color(red: 0.051, green: 0.800, blue: 0.600)

    /// Two-stop violet → indigo for buttons, avatars, fills
    static let heroGradient = LinearGradient(
        colors: [violet, indigo],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Three-stop full spectrum for hero banners
    static let splashGradient = LinearGradient(
        colors: [violet, indigo, cyan],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - Per-status colour
    static func statusColor(for status: ApplicationStatus) -> Color {
        switch status {
        case .draft:     return Color(.systemGray)
        case .sent:      return indigo
        case .interview: return Color.orange
        case .offer:     return emerald
        case .rejected:  return Color(red: 0.95, green: 0.25, blue: 0.25)
        case .withdrawn: return Color(.systemGray2)
        }
    }

    // MARK: - Per-company avatar gradient (varies by name)
    static func avatarGradient(for name: String) -> LinearGradient {
        let palettes: [(Color, Color)] = [
            (violet,                                  indigo),
            (indigo,                                  cyan),
            (cyan,                                    emerald),
            (Color(red: 0.95, green: 0.45, blue: 0.13), Color(red: 0.98, green: 0.70, blue: 0.00)),
            (Color(red: 0.82, green: 0.18, blue: 0.58), violet),
        ]
        let pair = palettes[abs(name.hashValue) % palettes.count]
        return LinearGradient(colors: [pair.0, pair.1],
                              startPoint: .topLeading,
                              endPoint: .bottomTrailing)
    }
}

// MARK: - Gradient Button Style

struct GradientButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(
                Brand.heroGradient
                    .opacity(configuration.isPressed ? 0.78 : 1.0)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Gradient Checkmark Circle

struct GradientCheckCircle: View {
    let isSelected: Bool
    var size: CGFloat = 28

    var body: some View {
        ZStack {
            Circle().fill(Color(.systemGray5))
            if isSelected {
                Circle().fill(Brand.heroGradient)
                Image(systemName: "checkmark")
                    .font(.system(size: size * 0.38, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Company Avatar

struct CompanyAvatar: View {
    let name: String
    var size: CGFloat = 44

    var initial: String { String(name.prefix(1)).uppercased() }

    var body: some View {
        ZStack {
            Brand.avatarGradient(for: name)
            Text(initial)
                .font(.system(size: size * 0.40, weight: .bold))
                .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.28))
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: ApplicationStatus

    var body: some View {
        let color = Brand.statusColor(for: status)
        Text(status.rawValue)
            .font(.caption2.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
            .overlay(Capsule().strokeBorder(color.opacity(0.30), lineWidth: 1))
    }
}

// MARK: - Gradient Icon (empty-state hero)

struct GradientIcon: View {
    let systemName: String
    var size: CGFloat = 64

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.28)
                .fill(Brand.heroGradient)
                .frame(width: size * 1.3, height: size * 1.3)
            Image(systemName: systemName)
                .font(.system(size: size * 0.55, weight: .semibold))
                .foregroundStyle(.white)
        }
    }
}
