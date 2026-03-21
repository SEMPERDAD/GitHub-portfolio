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
                                .listRowBackground(Color.clear)
                                .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                                .contentShape(Rectangle())
                                .onTapGesture { appToEdit = app }
                        }
                        .onDelete(perform: deleteApplications)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(Color(.systemGroupedBackground))
                }
            }
            .navigationTitle("Applications")
            .sheet(item: $appToEdit) { ApplicationDetailView(application: $0) }
        }
    }

    // MARK: - Filter Chips

    var filterPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "All", color: Brand.violet, isSelected: selectedFilter == nil) {
                    selectedFilter = nil
                }
                ForEach(ApplicationStatus.allCases, id: \.self) { status in
                    FilterChip(
                        title: status.rawValue,
                        color: Brand.statusColor(for: status),
                        isSelected: selectedFilter == status
                    ) {
                        selectedFilter = (selectedFilter == status) ? nil : status
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
    }

    // MARK: - Empty State

    var emptyState: some View {
        VStack(spacing: 20) {
            GradientIcon(systemName: "list.clipboard.fill", size: 60)
            VStack(spacing: 6) {
                Text("No Applications Yet")
                    .font(.title2.bold())
                Text("Submit applications from the Apply tab\nto track them here.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 40)
    }

    private func deleteApplications(at offsets: IndexSet) {
        let idsToDelete = offsets.map { filtered[$0].id }
        let storeOffsets = IndexSet(
            store.applications.enumerated()
                .filter { idsToDelete.contains($0.element.id) }
                .map(\.offset)
        )
        store.deleteApplications(at: storeOffsets)
    }
}

// MARK: - Application Row Card

struct ApplicationRowView: View {
    let app: JobApplication

    var body: some View {
        HStack(spacing: 14) {
            // Status icon in a colored circle
            let color = Brand.statusColor(for: app.status)
            ZStack {
                Circle().fill(color.opacity(0.15))
                Image(systemName: app.status.systemImage)
                    .font(.subheadline.bold())
                    .foregroundStyle(color)
            }
            .frame(width: 40, height: 40)

            VStack(alignment: .leading, spacing: 3) {
                Text(app.job.position).font(.subheadline.bold())
                Text(app.job.company)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(app.dateApplied.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            StatusBadge(status: app.status)
        }
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.bold())
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? color : Color(.systemGray5))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
        .animation(.easeOut(duration: 0.15), value: isSelected)
    }
}

#Preview {
    ApplicationsView()
        .environmentObject(AppStore())
}
