import SwiftUI
import UIKit

struct PrintPreviewView: View {
    @Environment(\.dismiss) var dismiss
    let scrapbook: Scrapbook

    @State private var selectedPageIndices: Set<Int> = []
    @State private var printLayout: PrintLayout = .onePerPage
    @State private var includeCaptions = true
    @State private var isPrinting = false

    enum PrintLayout: String, CaseIterable {
        case onePerPage = "1 per page"
        case twoPerPage = "2 per page"
        case fourPerPage = "4 per page"

        var photosPerPage: Int {
            switch self { case .onePerPage: return 1; case .twoPerPage: return 2; case .fourPerPage: return 4 }
        }
    }

    private var allPhotos: [(photo: ScrapbookItem, pageTitle: String)] {
        scrapbook.pages.flatMap { page in
            page.items.filter { $0.type == .photo }.map { ($0, page.title) }
        }
    }

    private var selectedPhotos: [(photo: ScrapbookItem, pageTitle: String)] {
        if selectedPageIndices.isEmpty { return allPhotos }
        return scrapbook.pages.enumerated().filter { selectedPageIndices.contains($0.offset) }.flatMap { _, page in
            page.items.filter { $0.type == .photo }.map { ($0, page.title) }
        }
    }

    var body: some View {
        NavigationStack {
            List {
                // Print summary
                Section {
                    HStack(spacing: 16) {
                        Image(systemName: "printer.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.pink)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(scrapbook.title)
                                .font(.headline)
                            Text("\(selectedPhotos.count) photo\(selectedPhotos.count == 1 ? "" : "s") selected")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Page selection
                Section("Pages to Print") {
                    Button {
                        if selectedPageIndices.count == scrapbook.pages.count {
                            selectedPageIndices = []
                        } else {
                            selectedPageIndices = Set(scrapbook.pages.indices)
                        }
                    } label: {
                        HStack {
                            Text("All Pages")
                                .foregroundStyle(.primary)
                            Spacer()
                            if selectedPageIndices.count == scrapbook.pages.count || selectedPageIndices.isEmpty {
                                Image(systemName: selectedPageIndices.isEmpty
                                      ? "checkmark.circle"
                                      : "checkmark.circle.fill")
                                    .foregroundStyle(.pink)
                            }
                        }
                    }

                    ForEach(scrapbook.pages.indices, id: \.self) { idx in
                        let page = scrapbook.pages[idx]
                        let photoCount = page.items.filter { $0.type == .photo }.count
                        Button {
                            if selectedPageIndices.contains(idx) {
                                selectedPageIndices.remove(idx)
                            } else {
                                selectedPageIndices.insert(idx)
                            }
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(page.title)
                                        .foregroundStyle(.primary)
                                    Text("\(photoCount) photo\(photoCount == 1 ? "" : "s")")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if selectedPageIndices.contains(idx) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.pink)
                                }
                            }
                        }
                    }
                }

                // Print settings
                Section("Print Settings") {
                    Picker("Layout", selection: $printLayout) {
                        ForEach(PrintLayout.allCases, id: \.self) { layout in
                            Text(layout.rawValue).tag(layout)
                        }
                    }
                    Toggle("Include Captions", isOn: $includeCaptions)
                }

                // Print button
                Section {
                    Button {
                        printScrapbook()
                    } label: {
                        HStack {
                            Spacer()
                            if isPrinting {
                                ProgressView()
                                    .padding(.trailing, 8)
                            }
                            Label("Print Now", systemImage: "printer")
                                .font(.headline)
                            Spacer()
                        }
                    }
                    .listRowBackground(Color.pink)
                    .foregroundStyle(.white)
                    .disabled(selectedPhotos.isEmpty || isPrinting)

                    // Save as PDF option
                    Button {
                        savePDF()
                    } label: {
                        HStack {
                            Spacer()
                            Label("Save as PDF", systemImage: "doc.fill")
                                .font(.headline)
                            Spacer()
                        }
                    }
                    .listRowBackground(Color(.systemGray5))
                    .disabled(selectedPhotos.isEmpty)
                }
            }
            .navigationTitle("Print Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func printScrapbook() {
        let photos = selectedPhotos.compactMap { $0.photo.image }
        guard !photos.isEmpty else { return }

        isPrinting = true

        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .photo
        printInfo.jobName = scrapbook.title
        printInfo.orientation = .portrait

        let printController = UIPrintInteractionController.shared
        printController.printInfo = printInfo
        printController.printingItems = photos

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            printController.present(animated: true) { _, completed, error in
                isPrinting = false
                if completed { dismiss() }
            }
        }
    }

    private func savePDF() {
        let photos = selectedPhotos.compactMap { $0.photo.image }
        guard !photos.isEmpty else { return }

        let pdfData = generatePDF(from: photos)
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("\(scrapbook.title).pdf")

        do {
            try pdfData.write(to: tempURL)
            let shareSheet = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootVC = windowScene.windows.first?.rootViewController {
                rootVC.present(shareSheet, animated: true)
            }
        } catch {
            print("PDF save error: \(error)")
        }
    }

    private func generatePDF(from images: [UIImage]) -> Data {
        let pdfRenderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792))
        return pdfRenderer.pdfData { context in
            let photosPerPage = printLayout.photosPerPage
            let pageSize = CGSize(width: 612, height: 792)
            let margin: CGFloat = 36
            let cols = photosPerPage == 4 ? 2 : 1
            let rows = photosPerPage == 2 ? 2 : (photosPerPage == 4 ? 2 : 1)
            let photoW = (pageSize.width - margin * CGFloat(cols + 1)) / CGFloat(cols)
            let photoH = (pageSize.height - margin * CGFloat(rows + 1)) / CGFloat(rows)

            var idx = 0
            while idx < images.count {
                context.beginPage()
                for row in 0..<rows {
                    for col in 0..<cols {
                        guard idx < images.count else { break }
                        let x = margin + CGFloat(col) * (photoW + margin)
                        let y = margin + CGFloat(row) * (photoH + margin)
                        let rect = CGRect(x: x, y: y, width: photoW, height: photoH)
                        images[idx].draw(in: rect)
                        idx += 1
                    }
                }
            }
        }
    }
}

#Preview {
    PrintPreviewView(scrapbook: Scrapbook(title: "Summer 2024", ownerId: "user1"))
}
