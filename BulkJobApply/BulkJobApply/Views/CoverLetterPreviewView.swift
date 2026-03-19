import SwiftUI

struct CoverLetterPreviewView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss

    let job: JobOpportunity
    let customParagraph: String

    var coverLetter: String {
        store.profile.coverLetter(for: job, customParagraph: customParagraph)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(job.position)
                            .font(.title2.bold())
                        Text(job.company)
                            .font(.headline)
                            .foregroundStyle(.secondary)
                    }
                    Divider()
                    Text(coverLetter)
                        .font(.body)
                }
                .padding()
            }
            .navigationTitle("Cover Letter Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    ShareLink(item: coverLetter,
                              subject: Text("Application – \(job.position) at \(job.company)"),
                              message: Text(coverLetter))
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
