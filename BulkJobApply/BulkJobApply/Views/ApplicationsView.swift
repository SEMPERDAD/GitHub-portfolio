import SwiftUI

struct ApplicationsView: View {
    @EnvironmentObject var store: AppStore
    @State private var selectedFilter: ApplicationStatus? = nil
    @State private var appToEdit: JobApplication?

    var filtered: [JobApplication] {
        guard let filter = selectedFilter else { return store.applications }
        return store.applications.filter { $0.status == filter }
    }

    var body: some View {
        NavigationStack {
            Group {
                if store.applications.isEmpty {
                    emptyState
                } else {
                    List {
                        filterPicker
                        ForEach(filtered) { app in
                            ApplicationRowView(app: app)
                                .contentShape(Rectangle())
                                .onTapGesture { appToEdit = app }
                        }
                        .onDelete(perform: deleteApplications)
                    }
                }
            }
            .navigationTitle("Applications")
            .sheet(item: $appToEdit) { app in
                ApplicationDetailView(application: app)
            }
        }
    }

    var filterPicker: some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(title: "All", isSelected: selectedFilter == nil) {
                        selectedFilter = nil
                    }
                    ForEach(ApplicationStatus.allCases, id: \.self) { status in
                        FilterChip(title: status.rawValue, isSelected: selectedFilter == status) {
                            selectedFilter = (selectedFilter == status) ? nil : status
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .listRowInsets(.init(top: 8, leading: 8, bottom: 8, trailing: 8))
    }

    var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "list.clipboard")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text("No Applications Yet")
                .font(.title2.bold())
            Text("Submit applications from the Apply tab to track them here.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
        }
    }

    private func deleteApplications(at offsets: IndexSet) {
        // Map filtered indices back to store indices
        let idsToDelete = offsets.map { filtered[$0].id }
        let storeOffsets = IndexSet(
            store.applications.enumerated()
                .filter { idsToDelete.contains($0.element.id) }
                .map(\.offset)
        )
        store.deleteApplications(at: storeOffsets)
    }
}

struct ApplicationRowView: View {
    let app: JobApplication

    var statusColor: Color {
        switch app.status {
        case .draft:     return .gray
        case .sent:      return .blue
        case .interview: return .orange
        case .offer:     return .green
        case .rejected:  return .red
        case .withdrawn: return .secondary
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: app.status.systemImage)
                .foregroundStyle(statusColor)
                .font(.title3)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(app.job.position).font(.subheadline.bold())
                Text(app.job.company).font(.caption).foregroundStyle(.secondary)
                Text(app.dateApplied.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            Spacer()
            Text(app.status.rawValue)
                .font(.caption.bold())
                .foregroundStyle(statusColor)
        }
        .padding(.vertical, 4)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.bold())
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color(.systemGray5))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

#Preview {
    ApplicationsView()
        .environmentObject(AppStore())
}
