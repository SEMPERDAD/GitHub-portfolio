import UIKit

/// Shares scrapbook projects or photos via AirDrop / system share sheet.
struct AirDropService {

    // MARK: - Share project as JSON file

    @MainActor
    func shareProject(_ scrapbook: Scrapbook) {
        guard let data = try? JSONEncoder().encode(scrapbook) else { return }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(scrapbook.title).scrapbook")
        try? data.write(to: url)
        presentShareSheet(items: [url])
    }

    // MARK: - Share photos

    @MainActor
    func sharePhotos(_ images: [UIImage]) {
        guard !images.isEmpty else { return }
        presentShareSheet(items: images)
    }

    // MARK: - Private

    @MainActor
    private func presentShareSheet(items: [Any]) {
        let vc = UIActivityViewController(activityItems: items, applicationActivities: nil)
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        if let popover = vc.popoverPresentationController {
            popover.sourceView = root.view
            popover.sourceRect = CGRect(x: root.view.bounds.midX, y: root.view.bounds.midY, width: 0, height: 0)
        }
        root.present(vc, animated: true)
    }
}
