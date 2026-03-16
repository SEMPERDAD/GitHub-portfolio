import SwiftUI

/// Cute illustrated scrapbook logo — scales to any size.
/// Used in the nav bar (size: 30), empty state hero (size: 110), and app previews (size: 180+).
struct ScrapbookLogoView: View {
    var size: CGFloat = 120

    var body: some View {
        ZStack {
            // Background gradient
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(LinearGradient(
                    colors: [Color(red: 1.0, green: 0.47, blue: 0.62),
                             Color(red: 0.90, green: 0.24, blue: 0.48)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))

            // Soft inner highlight
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(RadialGradient(
                    colors: [.white.opacity(0.28), .clear],
                    center: UnitPoint(x: 0.28, y: 0.22),
                    startRadius: 0, endRadius: size * 0.55
                ))

            // Sparkle — top-left
            Image(systemName: "sparkle")
                .font(.system(size: size * 0.105, weight: .light))
                .foregroundStyle(.white.opacity(0.75))
                .offset(x: -size * 0.33, y: -size * 0.33)

            // Tiny star — bottom-right
            Image(systemName: "star.fill")
                .font(.system(size: size * 0.07))
                .foregroundStyle(.white.opacity(0.40))
                .offset(x: size * 0.34, y: size * 0.34)

            // Back page (rotated, peeking behind)
            RoundedRectangle(cornerRadius: size * 0.028, style: .continuous)
                .fill(Color(red: 0.96, green: 0.89, blue: 0.84))
                .frame(width: size * 0.58, height: size * 0.43)
                .rotationEffect(.degrees(-4.5), anchor: UnitPoint(x: 0.5, y: 1.0))
                .offset(x: -size * 0.05, y: size * 0.04)

            // Left page
            RoundedRectangle(cornerRadius: size * 0.025, style: .continuous)
                .fill(Color(red: 1.0, green: 0.97, blue: 0.93))
                .frame(width: size * 0.28, height: size * 0.41)
                .offset(x: -size * 0.19, y: size * 0.04)

            // Right page
            RoundedRectangle(cornerRadius: size * 0.025, style: .continuous)
                .fill(Color(red: 1.0, green: 0.97, blue: 0.93))
                .frame(width: size * 0.28, height: size * 0.41)
                .offset(x: size * 0.09, y: size * 0.04)

            // Spine
            Rectangle()
                .fill(Color(red: 0.76, green: 0.66, blue: 0.61).opacity(0.40))
                .frame(width: size * 0.016, height: size * 0.41)
                .offset(x: -size * 0.05, y: size * 0.04)

            // Ruled lines on left page
            VStack(spacing: size * 0.057) {
                ForEach(0..<3, id: \.self) { _ in
                    Capsule()
                        .fill(Color(red: 0.74, green: 0.63, blue: 0.58).opacity(0.38))
                        .frame(width: size * 0.18, height: size * 0.013)
                }
            }
            .offset(x: -size * 0.19, y: -size * 0.01)

            // Heart accent on left page
            Image(systemName: "heart.fill")
                .font(.system(size: size * 0.10))
                .foregroundStyle(Color(red: 1.0, green: 0.40, blue: 0.52))
                .offset(x: -size * 0.235, y: size * 0.16)

            // Polaroid photo — peeking from upper-right, tilted
            ZStack {
                RoundedRectangle(cornerRadius: size * 0.02, style: .continuous)
                    .fill(.white)
                    .frame(width: size * 0.245, height: size * 0.295)
                    .shadow(color: .black.opacity(0.16), radius: size * 0.025,
                            x: size * 0.007, y: size * 0.013)

                LinearGradient(
                    colors: [Color(red: 0.81, green: 0.73, blue: 0.94),
                             Color(red: 0.63, green: 0.80, blue: 0.97)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(width: size * 0.205, height: size * 0.175)
                .clipShape(RoundedRectangle(cornerRadius: size * 0.01, style: .continuous))
                .offset(y: -size * 0.034)

                Image(systemName: "photo.fill")
                    .font(.system(size: size * 0.068))
                    .foregroundStyle(.white.opacity(0.75))
                    .offset(y: -size * 0.034)
            }
            .rotationEffect(.degrees(13))
            .offset(x: size * 0.09, y: -size * 0.085)
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
    }
}

#Preview {
    HStack(spacing: 24) {
        ScrapbookLogoView(size: 60)
        ScrapbookLogoView(size: 120)
        ScrapbookLogoView(size: 180)
    }
    .padding(32)
    .background(Color(red: 0.96, green: 0.94, blue: 0.92))
}
