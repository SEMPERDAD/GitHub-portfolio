import SwiftUI
import UIKit

struct PrintPreviewView: View {
    @Environment(\.dismiss) var dismiss
    let scrapbook: Scrapbook

    @State private var selectedPageIndices: Set<Int> = []
    @State private var photosPerPage: Int = 1
    @State private var includeCaptions = true
    @State private var isPrinting = false

    private let printer = PrintService()

    private var allPhotos: [(photo: ScrapbookItem, pageTitle: String)] {
        scrapbook.pages.flatMap { page in
            page.items.filter { $0.type == .photo }.map { ($0, page.title) }
        }
    }

    private var selectedPhotos: [(photo: ScrapbookItem, pageTitle: String)] {
        if selectedPageIndices.isEmpty { return allPhotos }
        return scrapbook.pages.enumerated()
            .filter { selectedPageIndices.contains($0.offset) }
            .flatMap { _, page in page.items.filter { $0.type == .photo }.map { ($0, page.title) } }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 16) {
                        Image(systemName: "printer.fill").font(.largeTitle).foregroundStyle(.pink)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(scrapbook.title).font(.headline)
                            Text("\(selectedPhotos.count) photo\(selectedPhotos.count == 1 ? "" : "s") selected")
                                .font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                Section("Pages to Print") {
                    Button {
                        selectedPageIndices = selectedPageIndices.count == scrapbook.pages.count
                            ? [] : Set(scrapbook.pages.indices)
                    } label: {
                        HStack {
                            Text("All Pages").foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: selectedPageIndices.isEmpty ? "checkmark.circle" : "checkmark.circle.fill")
                                .foregroundStyle(.pink)
                        }
                    }

                    ForEach(scrapbook.pages.indices, id: \.self) { idx in
                        let page = scrapbook.pages[idx]
                        let count = page.items.filter { $0.type == .photo }.count
                        Button {
                            if selectedPageIndices.contains(idx) { selectedPageIndices.remove(idx) }
                            else { selectedPageIndices.insert(idx) }
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(page.title).foregroundStyle(.primary)
                                    Text("\(count) photo\(count == 1 ? "" : "s")")
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if selectedPageIndices.contains(idx) {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.pink)
                                }
                            }
                        }
                    }
                }

                Section("Print Settings") {
                    Picker("Layout", selection: $photosPerPage) {
                        Text("1 per page").tag(1)
                        Text("2 per page").tag(2)
                        Text("4 per page").tag(4)
                    }
                    Toggle("Include Captions", isOn: $includeCaptions)
                }

                Section {
                    Button { printNow() } label: {
                        HStack {
                            Spacer()
                            if isPrinting { ProgressView().padding(.trailing, 8) }
                            Label("Print Now", systemImage: "printer").font(.headline)
                            Spacer()
                        }
                    }
                    .listRowBackground(Color.pink)
                    .foregroundStyle(.white)
                    .disabled(selectedPhotos.isEmpty || isPrinting)

                    Button { savePDF() } label: {
                        HStack {
                            Spacer()
                            Label("Save as PDF", systemImage: "doc.fill").font(.headline)
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

    private func printNow() {
        let images = selectedPhotos.compactMap { $0.photo.image }
        guard !images.isEmpty else { return }
        isPrinting = true
        let opts = PrintService.Options(photosPerPage: photosPerPage, jobName: scrapbook.title)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            printer.printImages(images, options: opts) { completed in
                isPrinting = false
                if completed { dismiss() }
            }
        }
    }

    private func savePDF() {
        let images = selectedPhotos.compactMap { $0.photo.image }
        let opts = PrintService.Options(photosPerPage: photosPerPage, jobName: scrapbook.title)
        printer.savePDFAndShare(images, named: scrapbook.title, options: opts)
    }
}

#Preview {
    PrintPreviewView(scrapbook: Scrapbook(title: "Summer 2024", ownerId: "user1"))
}
