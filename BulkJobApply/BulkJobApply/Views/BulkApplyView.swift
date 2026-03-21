import SwiftUI

struct BulkApplyView: View {
    @EnvironmentObject var store: AppStore
    @State private var selectedJobs: Set<UUID> = []
    @State private var customParagraph = ""
    @State private var showingConfirmation = false
    @State private var showingPreview: JobOpportunity?
    @State private var showingSuccess = false

    var selectedList: [JobOpportunity] {
        store.jobs.filter { selectedJobs.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if store.jobs.isEmpty {
                    emptyState
                } else {
                    Form {
                        jobSelectionSection
                        if !selectedJobs.isEmpty {
                            customParagraphSection
                            previewSection
                            applySection
                        }
                    }
                }
            }
            .navigationTitle("Bulk Apply")
            .alert("Submit \(selectedJobs.count) Application\(selectedJobs.count == 1 ? "" : "s")?",
                   isPresented: $showingConfirmation) {
                Button("Submit", role: .destructive) { submitApplications() }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Applications will be marked as Sent and saved to your Tracker.")
            }
            .alert("Applications Submitted!", isPresented: $showingSuccess) {
                Button("OK") {
                    selectedJobs.removeAll()
                    customParagraph = ""
                }
            } message: {
                Text("Your applications have been recorded in the Tracker tab.")
            }
            .sheet(item: $showingPreview) { job in
                CoverLetterPreviewView(job: job, customParagraph: customParagraph)
            }
        }
    }

    // MARK: - Sections

    var jobSelectionSection: some View {
        Section {
            ForEach(store.jobs) { job in
                SelectableJobRow(job: job, isSelected: selectedJobs.contains(job.id)) {
                    withAnimation(.easeOut(duration: 0.15)) {
                        if selectedJobs.contains(job.id) {
                            selectedJobs.remove(job.id)
                        } else {
                            selectedJobs.insert(job.id)
                        }
                    }
                }
            }
        } header: {
            HStack {
                Text("Select Jobs")
                Spacer()
                if !store.jobs.isEmpty {
                    Button(selectedJobs.count == store.jobs.count ? "Deselect All" : "Select All") {
                        withAnimation {
                            if selectedJobs.count == store.jobs.count {
                                selectedJobs.removeAll()
                            } else {
                                selectedJobs = Set(store.jobs.map(\.id))
                            }
                        }
                    }
                    .font(.caption.bold())
                    .foregroundStyle(Brand.violet)
                    .textCase(nil)
                }
            }
        } footer: {
            if !store.jobs.isEmpty {
                HStack(spacing: 4) {
                    Text("\(selectedJobs.count)")
                        .foregroundStyle(Brand.violet)
                        .fontWeight(.semibold)
                    Text("of \(store.jobs.count) selected")
                }
                .font(.caption)
            }
        }
    }

    var customParagraphSection: some View {
        Section("Custom Paragraph (optional)") {
            TextEditor(text: $customParagraph)
                .frame(minHeight: 100)
                .overlay(alignment: .topLeading) {
                    if customParagraph.isEmpty {
                        Text("Add a personal touch for this batch…")
                            .foregroundStyle(.tertiary)
                            .padding(.top, 8)
                            .padding(.leading, 4)
                            .allowsHitTesting(false)
                    }
                }
        }
    }

    var previewSection: some View {
        Section("Preview Cover Letters") {
            ForEach(selectedList, id: \.id) { job in
                Button {
                    showingPreview = job
                } label: {
                    HStack(spacing: 12) {
                        CompanyAvatar(name: job.company, size: 36)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(job.position).font(.subheadline.bold())
                            Text(job.company).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "eye.fill")
                            .foregroundStyle(Brand.violet)
                            .font(.subheadline)
                    }
                }
                .foregroundStyle(.primary)
            }
        }
    }

    var applySection: some View {
        Section {
            Button {
                showingConfirmation = true
            } label: {
                Label(
                    "Submit \(selectedJobs.count) Application\(selectedJobs.count == 1 ? "" : "s")",
                    systemImage: "paperplane.fill"
                )
            }
            .buttonStyle(GradientButtonStyle())
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        }
    }

    var emptyState: some View {
        VStack(spacing: 20) {
            GradientIcon(systemName: "paperplane.fill", size: 60)
            VStack(spacing: 6) {
                Text("No Jobs to Apply To")
                    .font(.title2.bold())
                Text("Add job opportunities in the Jobs tab first.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 40)
    }

    private func submitApplications() {
        store.submitApplications(for: selectedList, customParagraph: customParagraph)
        showingSuccess = true
    }
}

// MARK: - Selectable Row

struct SelectableJobRow: View {
    let job: JobOpportunity
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                GradientCheckCircle(isSelected: isSelected)

                CompanyAvatar(name: job.company, size: 36)

                VStack(alignment: .leading, spacing: 2) {
                    Text(job.position).font(.subheadline.bold())
                    Text(job.company).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                if let deadline = job.deadline {
                    Text(deadline.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption2)
                        .foregroundStyle(deadline < Date() ? .red : Brand.violet)
                }
            }
        }
        .foregroundStyle(.primary)
    }
}

#Preview {
    BulkApplyView()
        .environmentObject(AppStore())
}
