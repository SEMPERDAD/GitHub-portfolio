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
                        statsHeader
                        ForEach(store.jobs) { job in
                            JobRowView(job: job)
                                .listRowBackground(Color.clear)
                                .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                                .contentShape(Rectangle())
                                .onTapGesture { jobToEdit = job }
                        }
                        .onDelete(perform: store.deleteJobs)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(Color(.systemGroupedBackground))
                }
            }
            .navigationTitle("Job Listings")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddJob = true
                    } label: {
                        ZStack {
                            Circle().fill(Brand.heroGradient).frame(width: 32, height: 32)
                            Image(systemName: "plus")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    if !store.jobs.isEmpty { EditButton() }
                }
            }
            .sheet(isPresented: $showingAddJob) { AddJobView() }
            .sheet(item: $jobToEdit) { AddJobView(existingJob: $0) }
        }
    }

    // MARK: - Stats Banner

    var statsHeader: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 18)
                .fill(Brand.heroGradient)
            HStack(spacing: 0) {
                statItem(value: "\(store.jobs.count)", label: "Listed")
                divider
                statItem(value: "\(store.jobs.filter { $0.deadline != nil && $0.deadline! > Date() }.count)", label: "Active")
                divider
                statItem(value: "\(store.jobs.filter { ($0.deadline ?? Date.distantFuture) < Date() }.count)", label: "Expired")
            }
            .padding(.vertical, 14)
        }
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        .listRowSeparator(.hidden)
    }

    private func statItem(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title2.bold()).foregroundStyle(.white)
            Text(label).font(.caption2).foregroundStyle(.white.opacity(0.75))
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(.white.opacity(0.3))
            .frame(width: 1, height: 32)
    }

    // MARK: - Empty State

    var emptyState: some View {
        VStack(spacing: 20) {
            GradientIcon(systemName: "briefcase.fill", size: 60)
            VStack(spacing: 6) {
                Text("No Jobs Yet")
                    .font(.title2.bold())
                Text("Tap + to add job opportunities\nyou want to apply for.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            Button("Add First Job") { showingAddJob = true }
                .buttonStyle(GradientButtonStyle())
                .padding(.horizontal, 60)
        }
        .padding(.bottom, 40)
    }
}

// MARK: - Job Row Card

struct JobRowView: View {
    let job: JobOpportunity

    var body: some View {
        HStack(spacing: 14) {
            CompanyAvatar(name: job.company)

            VStack(alignment: .leading, spacing: 3) {
                Text(job.position)
                    .font(.subheadline.bold())
                Text(job.company)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let deadline = job.deadline {
                    Label(deadline.formatted(date: .abbreviated, time: .omitted),
                          systemImage: "calendar")
                        .font(.caption2)
                        .foregroundStyle(deadline < Date() ? .red : Brand.violet)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption2.bold())
                .foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

#Preview {
    JobsView()
        .environmentObject(AppStore())
}
