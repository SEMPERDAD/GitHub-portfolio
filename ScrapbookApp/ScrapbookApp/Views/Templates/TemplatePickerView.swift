import SwiftUI

struct TemplatePickerView: View {
    let onSelect: (PageTemplate) -> Void
    @Environment(\.dismiss) private var dismiss

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(PageTemplate.all) { template in
                        TemplateCard(template: template)
                            .onTapGesture { onSelect(template); dismiss() }
                    }
                }
                .padding(16)
                .padding(.bottom, 8)
            }
            .background(Color(red: 0.99, green: 0.97, blue: 0.95))
            .navigationTitle("Choose a Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Card

private struct TemplateCard: View {
    let template: PageTemplate
    @State private var pressed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            TemplatePreviewView(template: template).frame(height: 124)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Text(template.emoji).font(.subheadline)
                    Text(template.name).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                }
                Text(template.aesthetic).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .shadow(color: Color(red: 0.6, green: 0.4, blue: 0.5).opacity(0.10), radius: 8, x: 0, y: 4)
        .scaleEffect(pressed ? 0.95 : 1.0)
        .animation(.spring(response: 0.2, dampingFraction: 0.7), value: pressed)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity,
                            pressing: { pressed = $0 }, perform: {})
    }
}

// MARK: - Live layout preview

private struct TemplatePreviewView: View {
    let template: PageTemplate

    var body: some View {
        (Color(hex: template.backgroundColor) ?? Color(red: 1, green: 0.99, blue: 0.97))
            .overlay {
                GeometryReader { geo in
                    let scale = geo.size.width / 390.0
                    ZStack {
                        if template.placeholderItems.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "sparkles").font(.system(size: 24))
                                Text("Blank Canvas").font(.caption)
                            }
                            .foregroundStyle(template.accentColor.opacity(0.55))
                        } else {
                            ForEach(template.placeholderItems) { item in
                                itemView(item, scale: scale)
                            }
                        }
                    }
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    @ViewBuilder
    private func itemView(_ item: ScrapbookItem, scale: CGFloat) -> some View {
        switch item.type {
        case .photo:   photoThumb(item, scale: scale)
        case .text:    textThumb(item, scale: scale)
        case .sticker: stickerThumb(item, scale: scale)
        }
    }

    private func photoThumb(_ item: ScrapbookItem, scale: CGFloat) -> some View {
        let w = CGFloat(item.width) * scale
        let h = CGFloat(item.height) * scale
        let capH = item.borderStyle == .polaroid ? 44.0 * scale : 0.0

        return ZStack {
            if item.borderStyle == .polaroid {
                VStack(spacing: 0) {
                    Rectangle().fill(template.accentColor.opacity(0.28)).frame(width: w, height: h)
                    Rectangle().fill(.white).frame(width: w, height: capH)
                }
                .overlay(RoundedRectangle(cornerRadius: 2).stroke(.white, lineWidth: 5 * scale))
                .shadow(color: .black.opacity(0.12), radius: 3 * scale, x: scale, y: 2 * scale)
            } else {
                RoundedRectangle(cornerRadius: 4 * scale, style: .continuous)
                    .fill(template.accentColor.opacity(0.28))
                    .frame(width: w, height: h + capH)
                    .shadow(color: .black.opacity(0.10), radius: 3 * scale)
            }
            Image(systemName: "photo.fill")
                .font(.system(size: 22 * scale))
                .foregroundStyle(template.accentColor.opacity(0.45))
                .offset(y: item.borderStyle == .polaroid ? -(capH / 2) : 0)
        }
        .rotationEffect(.degrees(item.rotation))
        .offset(x: CGFloat(item.positionX) * scale, y: CGFloat(item.positionY) * scale)
    }

    private func textThumb(_ item: ScrapbookItem, scale: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 3, style: .continuous)
            .fill(template.accentColor.opacity(0.22))
            .frame(width: 110 * scale, height: 14 * scale)
            .rotationEffect(.degrees(item.rotation))
            .offset(x: CGFloat(item.positionX) * scale, y: CGFloat(item.positionY) * scale)
    }

    private func stickerThumb(_ item: ScrapbookItem, scale: CGFloat) -> some View {
        Text(item.text ?? "")
            .font(.system(size: 32 * scale))
            .rotationEffect(.degrees(item.rotation))
            .offset(x: CGFloat(item.positionX) * scale, y: CGFloat(item.positionY) * scale)
    }
}

#Preview {
    TemplatePickerView { _ in }
}
