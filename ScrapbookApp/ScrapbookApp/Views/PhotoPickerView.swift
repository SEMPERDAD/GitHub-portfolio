import SwiftUI
import PhotosUI

struct PhotoPickerView: View {
    @EnvironmentObject var store: ScrapbookStore
    @Environment(\.dismiss) var dismiss

    let pageId: UUID
    let bookId: UUID

    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isImporting = false
    @State private var importCount = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Header illustration
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [.pink.opacity(0.2), .purple.opacity(0.2)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                        .frame(width: 120, height: 120)
                    Image(systemName: "photo.stack.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.pink)
                }
                .padding(.top, 32)

                Text("Import Photos")
                    .font(.title2.weight(.bold))

                Text("Select photos from your library to add to this page. You can add multiple photos at once.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                PhotosPicker(
                    selection: $selectedItems,
                    maxSelectionCount: 20,
                    matching: .images
                ) {
                    Label("Choose Photos", systemImage: "photo.on.rectangle.angled")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.pink)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.horizontal, 24)
                .onChange(of: selectedItems) { _, newItems in
                    Task { await importPhotos(newItems) }
                }

                if isImporting {
                    VStack(spacing: 8) {
                        ProgressView()
                        Text("Importing \(importCount) photo\(importCount == 1 ? "" : "s")...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                // Camera option
                Button {
                    dismiss()
                } label: {
                    Text("Cancel")
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func importPhotos(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        isImporting = true
        importCount = items.count

        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                await MainActor.run {
                    store.addPhoto(image, to: pageId, in: bookId)
                }
            }
        }

        isImporting = false
        selectedItems = []
        dismiss()
    }
}

// MARK: - Camera Capture

struct CameraPickerView: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void
    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraPickerView
        init(_ parent: CameraPickerView) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onCapture(image)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    PhotoPickerView(pageId: UUID(), bookId: UUID())
        .environmentObject(ScrapbookStore())
}
