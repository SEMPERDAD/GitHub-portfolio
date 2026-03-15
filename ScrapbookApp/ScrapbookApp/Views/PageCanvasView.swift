import SwiftUI

struct PageCanvasView: View {
    @EnvironmentObject var store: ScrapbookStore
    let page: ScrapbookPage
    let bookId: UUID
    let isEditing: Bool

    @State private var selectedItemId: UUID?

    var body: some View {
        ZStack {
            // Page background
            Color(hex: page.backgroundColor) ?? Color(hex: "#FFFDF7")!

            // Subtle paper texture dots
            Canvas { context, size in
                let spacing: CGFloat = 28
                var y: CGFloat = spacing
                while y < size.height {
                    var x: CGFloat = spacing
                    while x < size.width {
                        let rect = CGRect(x: x - 1, y: y - 1, width: 2, height: 2)
                        context.fill(Path(ellipseIn: rect), with: .color(.gray.opacity(0.12)))
                        x += spacing
                    }
                    y += spacing
                }
            }
            .allowsHitTesting(false)

            // Photo / item items
            ForEach(page.items) { item in
                ScrapbookItemView(
                    item: item,
                    isSelected: selectedItemId == item.id,
                    isEditing: isEditing,
                    onSelect: { selectedItemId = item.id },
                    onUpdate: { updated in
                        store.updateItem(updated, on: page.id, in: bookId)
                    },
                    onDelete: {
                        store.deleteItem(item, from: page.id, in: bookId)
                        selectedItemId = nil
                    }
                )
            }

            if page.items.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "photo.badge.plus")
                        .font(.system(size: 48))
                        .foregroundStyle(.pink.opacity(0.4))
                    Text("Tap  to add photos")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .onTapGesture {
            if isEditing { selectedItemId = nil }
        }
    }
}

struct ScrapbookItemView: View {
    let item: ScrapbookItem
    let isSelected: Bool
    let isEditing: Bool
    let onSelect: () -> Void
    let onUpdate: (ScrapbookItem) -> Void
    let onDelete: () -> Void

    @State private var position: CGSize
    @State private var rotation: Double
    @State private var scale: Double
    @State private var showingCaption = false
    @State private var captionText: String

    init(item: ScrapbookItem, isSelected: Bool, isEditing: Bool,
         onSelect: @escaping () -> Void, onUpdate: @escaping (ScrapbookItem) -> Void,
         onDelete: @escaping () -> Void) {
        self.item = item
        self.isSelected = isSelected
        self.isEditing = isEditing
        self.onSelect = onSelect
        self.onUpdate = onUpdate
        self.onDelete = onDelete
        _position = State(initialValue: CGSize(width: item.positionX, height: item.positionY))
        _rotation = State(initialValue: item.rotation)
        _scale = State(initialValue: item.scale)
        _captionText = State(initialValue: item.caption ?? "")
    }

    var body: some View {
        itemContent
            .scaleEffect(scale)
            .rotationEffect(.degrees(rotation))
            .offset(position)
            .overlay(selectionOverlay)
            .gesture(dragGesture)
            .gesture(rotationGesture)
            .gesture(magnificationGesture)
            .onTapGesture { if isEditing { onSelect() } }
    }

    @ViewBuilder
    private var itemContent: some View {
        switch item.type {
        case .photo:
            photoView
        case .text:
            textItemView
        case .sticker:
            stickerView
        }
    }

    private var photoView: some View {
        VStack(spacing: 0) {
            Group {
                if let img = item.image {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(width: CGFloat(item.width), height: CGFloat(item.height))
                        .clipped()
                } else {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(width: CGFloat(item.width), height: CGFloat(item.height))
                }
            }

            if item.borderStyle == .polaroid {
                // Polaroid caption area
                Rectangle()
                    .fill(.white)
                    .frame(width: CGFloat(item.width), height: 44)
                    .overlay(
                        Text(captionText.isEmpty ? "" : captionText)
                            .font(.system(.caption, design: .handwriting))
                            .foregroundStyle(.black.opacity(0.7))
                            .padding(.horizontal, 4)
                    )
            }
        }
        .background(.white)
        .shadow(color: .black.opacity(0.2), radius: 4, x: 1, y: 2)
        .overlay(
            item.borderStyle == .polaroid
            ? RoundedRectangle(cornerRadius: 2).stroke(.white, lineWidth: 6)
            : nil
        )
    }

    private var textItemView: some View {
        Text(item.text ?? "Tap to edit")
            .font(.system(.body, design: .handwriting))
            .padding(8)
            .frame(minWidth: 80)
            .background(.white.opacity(0.85))
            .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private var stickerView: some View {
        Text(item.text ?? "⭐")
            .font(.system(size: CGFloat(item.width)))
    }

    @ViewBuilder
    private var selectionOverlay: some View {
        if isSelected && isEditing {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 4)
                    .stroke(.blue, lineWidth: 2)
                    .frame(
                        width: CGFloat(item.width) + 8,
                        height: CGFloat(item.height) + (item.borderStyle == .polaroid ? 52 : 8)
                    )

                Button(action: onDelete) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(.white, .red)
                }
                .offset(x: 12, y: -12)
            }
        }
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                guard isEditing else { return }
                position = CGSize(
                    width: item.positionX + value.translation.width,
                    height: item.positionY + value.translation.height
                )
            }
            .onEnded { value in
                guard isEditing else { return }
                var updated = item
                updated.positionX = item.positionX + value.translation.width
                updated.positionY = item.positionY + value.translation.height
                onUpdate(updated)
            }
    }

    private var rotationGesture: some Gesture {
        RotationGesture()
            .onChanged { angle in
                guard isEditing else { return }
                rotation = item.rotation + angle.degrees
            }
            .onEnded { angle in
                guard isEditing else { return }
                var updated = item
                updated.rotation = item.rotation + angle.degrees
                onUpdate(updated)
            }
    }

    private var magnificationGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                guard isEditing else { return }
                scale = item.scale * value
            }
            .onEnded { value in
                guard isEditing else { return }
                var updated = item
                updated.scale = item.scale * value
                onUpdate(updated)
            }
    }
}

extension Color {
    init?(hex: String) {
        var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexStr.hasPrefix("#") { hexStr.removeFirst() }
        guard hexStr.count == 6, let hexVal = UInt64(hexStr, radix: 16) else { return nil }
        self.init(
            red: Double((hexVal >> 16) & 0xFF) / 255,
            green: Double((hexVal >> 8) & 0xFF) / 255,
            blue: Double(hexVal & 0xFF) / 255
        )
    }
}
