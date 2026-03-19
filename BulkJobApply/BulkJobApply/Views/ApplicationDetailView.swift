import SwiftUI

struct ApplicationDetailView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss

    @State var application: JobApplication

    var body: some View {
        NavigationStack {
            Form {
                Section("Job") {
                    LabeledContent("Position", value: application.job.position)
                    LabeledContent("Company", value: application.job.company)
                    LabeledContent("Applied", value: application.dateApplied.formatted(date: .long, time: .omitted))
                }

                Section("Status") {
                    Picker("Status", selection: $application.status) {
                        ForEach(ApplicationStatus.allCases, id: \.self) { status in
                            Label(status.rawValue, systemImage: status.systemImage).tag(status)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Follow Up") {
                    DatePicker("Follow Up Date",
                               selection: Binding(
                                get: { application.followUpDate ?? Date() },
                                set: { application.followUpDate = $0 }
                               ),
                               displayedComponents: .date)
                    Button("Clear Follow Up") {
                        application.followUpDate = nil
                    }
                    .foregroundStyle(.red)
                }

                Section("Notes") {
                    TextEditor(text: $application.notes)
                        .frame(minHeight: 80)
                }

                Section("Cover Letter") {
                    NavigationLink("View Cover Letter") {
                        ScrollView {
                            Text(application.coverLetter)
                                .padding()
                        }
                        .navigationTitle("Cover Letter")
                        .toolbar {
                            ToolbarItem(placement: .primaryAction) {
                                ShareLink(item: application.coverLetter)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Application Detail")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        store.updateApplication(application)
                        dismiss()
                    }
                }
            }
        }
    }
}
