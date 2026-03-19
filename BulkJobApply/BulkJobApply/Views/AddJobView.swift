import SwiftUI

struct AddJobView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss

    var existingJob: JobOpportunity?

    @State private var company = ""
    @State private var position = ""
    @State private var jobURL = ""
    @State private var contactEmail = ""
    @State private var notes = ""
    @State private var hasDeadline = false
    @State private var deadline = Date().addingTimeInterval(60 * 60 * 24 * 14)

    var isEditing: Bool { existingJob != nil }
    var canSave: Bool { !company.trimmingCharacters(in: .whitespaces).isEmpty &&
                        !position.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Company") {
                    TextField("Company Name *", text: $company)
                    TextField("Position / Role *", text: $position)
                    TextField("Job Posting URL", text: $jobURL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section("Contact") {
                    TextField("Contact Email", text: $contactEmail)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section("Deadline") {
                    Toggle("Has Deadline", isOn: $hasDeadline)
                    if hasDeadline {
                        DatePicker("Deadline", selection: $deadline, displayedComponents: .date)
                    }
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle(isEditing ? "Edit Job" : "Add Job")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isEditing ? "Update" : "Add") {
                        saveJob()
                    }
                    .disabled(!canSave)
                }
            }
            .onAppear { populateIfEditing() }
        }
    }

    private func populateIfEditing() {
        guard let job = existingJob else { return }
        company = job.company
        position = job.position
        jobURL = job.jobURL
        contactEmail = job.contactEmail
        notes = job.notes
        if let d = job.deadline {
            hasDeadline = true
            deadline = d
        }
    }

    private func saveJob() {
        var job = existingJob ?? JobOpportunity(company: "", position: "", jobURL: "", contactEmail: "", notes: "")
        job.company = company.trimmingCharacters(in: .whitespaces)
        job.position = position.trimmingCharacters(in: .whitespaces)
        job.jobURL = jobURL.trimmingCharacters(in: .whitespaces)
        job.contactEmail = contactEmail.trimmingCharacters(in: .whitespaces)
        job.notes = notes
        job.deadline = hasDeadline ? deadline : nil

        if isEditing {
            store.updateJob(job)
        } else {
            store.addJob(job)
        }
        dismiss()
    }
}

#Preview {
    AddJobView()
        .environmentObject(AppStore())
}
