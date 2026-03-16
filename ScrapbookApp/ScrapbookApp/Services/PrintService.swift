import UIKit

/// Generates letter-sized PDFs and drives UIPrintInteractionController.
struct PrintService {

    struct Options {
        var photosPerPage: Int = 1
        var jobName: String = "Scrapbook"
    }

    // MARK: - PDF Generation

    func generatePDF(from images: [UIImage], options: Options = Options()) -> Data {
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        return renderer.pdfData { ctx in
            let margin: CGFloat = 36
            let cols = options.photosPerPage == 4 ? 2 : 1
            let rows = options.photosPerPage >= 2 ? 2 : 1
            let cellW = (pageRect.width  - margin * CGFloat(cols + 1)) / CGFloat(cols)
            let cellH = (pageRect.height - margin * CGFloat(rows + 1)) / CGFloat(rows)

            var idx = 0
            while idx < images.count {
                ctx.beginPage()
                for row in 0..<rows {
                    for col in 0..<cols {
                        guard idx < images.count else { break }
                        let x = margin + CGFloat(col) * (cellW + margin)
                        let y = margin + CGFloat(row) * (cellH + margin)
                        images[idx].draw(in: CGRect(x: x, y: y, width: cellW, height: cellH))
                        idx += 1
                    }
                }
            }
        }
    }

    // MARK: - System Print Dialog

    func printImages(_ images: [UIImage], options: Options = Options(), completion: @escaping (Bool) -> Void) {
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .photo
        info.jobName = options.jobName
        info.orientation = .portrait

        let controller = UIPrintInteractionController.shared
        controller.printInfo = info
        controller.printingItems = images
        controller.present(animated: true) { _, completed, _ in
            completion(completed)
        }
    }

    // MARK: - Save PDF to disk & share

    @MainActor
    func savePDFAndShare(_ images: [UIImage], named name: String, options: Options = Options()) {
        let data = generatePDF(from: images, options: options)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(name).pdf")
        guard (try? data.write(to: url)) != nil else { return }

        let vc = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        root.present(vc, animated: true)
    }
}
