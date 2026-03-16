import SwiftUI

// MARK: - Page Canvas

struct PageCanvasView: View {
    @EnvironmentObject var viewModel: ScrapbookViewModel
    let page: ScrapbookPage
    let bookId: UUID
    let isEditing: Bool

    @State private var selectedItemId: UUID?

    var body: some View {
        ZStack {
            Color(hex: page.backgroundColor) ?? Color(hex: "#FFFDF7")!

            // Subtle paper-texture dot grid
            Canvas { context, size in
                let spacing: CGFloat = 28
                var y: CGFloat = spacing
                while y < size.height {
                    var x: CGFloat = spacing
                    while x < size.width {
                        context.fill(
                            Path(ellipseIn: CGRect(x: x - 1, y: y - 1, width: 2, height: 2)),
                            with: .color(.gray.opacity(0.12))
                        )
                        x += spacing
                    }
                    y += spacing
                }
            }
            .allowsHitTesting(false)

            ForEach(page.items) { item in
                ElementView(
                    item: item,
                    isSelected: selectedItemId == item.id,
                    isEditing: isEditing,
                    onSelect: { selectedItemId = item.id },
                    onUpdate: { viewModel.updateItem($0, on: page.id, in: bookId) },
                    onDelete: {
                        viewModel.deleteItem(item, from: page.id, in: bookId)
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
        .onTapGesture { if isEditing { selectedItemId = nil } }
    }
}

// MARK: - Element (draggable / resizable item)

struct ElementView: View {
    let item: ScrapbookItem
    let isSelected: Bool
    let isEditing: Bool
    let onSelect: () -> Void
    let onUpdate: (ScrapbookItem) -> Void
    let onDelete: () -> Void

    @State private var position: CGSize
    @State private var rotation: Double
    @State private var scale: Double
    @State private var captionText: String

    init(item: ScrapbookItem, isSelected: Bool, isEditing: Bool,
         onSelect: @escaping () -> Void,
         onUpdate: @escaping (ScrapbookItem) -> Void,
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
        case .photo:   photoView
        case .text:    textView
        case .sticker: stickerView
        }
    }

    private var photoView: some View {
        VStack(spacing: 0) {
            Group {
                if let img = item.image {
                    Image(uiImage: img)
                        .resizable().scaledToFill()
                        .frame(width: CGFloat(item.width), height: CGFloat(item.height))
                        .clipped()
                } else {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(width: CGFloat(item.width), height: CGFloat(item.height))
                }
            }

            if item.borderStyle == .polaroid {
                Rectangle()
                    .fill(.white)
                    .frame(width: CGFloat(item.width), height: 44)
                    .overlay(
                        Text(captionText.isEmpty ? "" : captionText)
                            .font(.system(.caption, design: .rounded))
                            .foregroundStyle(.black.opacity(0.7))
                            .padding(.horizontal, 4)
                    )
            }
        }
        .background(.white)
        .shadow(color: .black.opacity(0.2), radius: 4, x: 1, y: 2)
        .overlay {
            if item.borderStyle == .polaroid {
                RoundedRectangle(cornerRadius: 2).stroke(.white, lineWidth: 6)
            }
        }
    }

    private var textView: some View {
        Text(item.text ?? "Tap to edit")
            .font(.system(.body, design: .rounded))
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
            .onChanged { v in
                guard isEditing else { return }
                position = CGSize(width: item.positionX + v.translation.width,
                                  height: item.positionY + v.translation.height)
            }
            .onEnded { v in
                guard isEditing else { return }
                var updated = item
                updated.positionX = item.positionX + v.translation.width
                updated.positionY = item.positionY + v.translation.height
                onUpdate(updated)
            }
    }

    private var rotationGesture: some Gesture {
        RotationGesture()
            .onChanged { a in guard isEditing else { return }; rotation = item.rotation + a.degrees }
            .onEnded { a in
                guard isEditing else { return }
                var updated = item; updated.rotation = item.rotation + a.degrees; onUpdate(updated)
            }
    }

    private var magnificationGesture: some Gesture {
        MagnificationGesture()
            .onChanged { v in guard isEditing else { return }; scale = item.scale * Double(v) }
            .onEnded { v in
                guard isEditing else { return }
                var updated = item; updated.scale = item.scale * Double(v); onUpdate(updated)
            }
    }
}
