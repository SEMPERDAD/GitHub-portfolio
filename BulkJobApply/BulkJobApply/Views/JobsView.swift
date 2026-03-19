import SwiftUI

struct JobsView: View {
    @EnvironmentObject var store: AppStore
    @State private var showingAddJob = false
    @State private var jobToEdit: JobOpportunity?

    var body: some View {
        NavigationStack {
            Group {
                if store.jobs.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(store.jobs) { job in
                            JobRowView(job: job)
                                .contentShape(Rectangle())
                                .onTapGesture { jobToEdit = job }
                        }
                        .onDelete(perform: store.deleteJobs)
                    }
                }
            }
            .navigationTitle("Job Listings")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showingAddJob = true } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    if !store.jobs.isEmpty { EditButton() }
                }
            }
            .sheet(isPresented: $showingAddJob) {
                AddJobView()
            }
            .sheet(item: $jobToEdit) { job in
                AddJobView(existingJob: job)
            }
        }
    }

    var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "briefcase")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text("No Jobs Yet")
                .font(.title2.bold())
            Text("Tap + to add job opportunities you want to apply for.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
            Button("Add First Job") { showingAddJob = true }
                .buttonStyle(.borderedProminent)
        }
    }
}

struct JobRowView: View {
    let job: JobOpportunity

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(job.position)
                .font(.headline)
            Text(job.company)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            if let deadline = job.deadline {
                Label(deadline.formatted(date: .abbreviated, time: .omitted),
                      systemImage: "calendar")
                    .font(.caption)
                    .foregroundStyle(deadline < Date() ? .red : .orange)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    JobsView()
        .environmentObject(AppStore())
}
