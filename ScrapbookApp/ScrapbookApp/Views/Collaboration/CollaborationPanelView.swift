import SwiftUI

struct CollaborationPanelView: View {
    @EnvironmentObject var viewModel: ScrapbookViewModel
    @Environment(\.dismiss) var dismiss

    let scrapbook: Scrapbook

    @State private var emailInput = ""
    @State private var selectedRole: ScrapbookUser.UserRole = .editor
    @State private var generatedLink: InviteLink?
    @State private var showingShareSheet = false
    @State private var showAlert = false
    @State private var alertMessage = ""

    private var currentBook: Scrapbook {
        viewModel.scrapbooks.first { $0.id == scrapbook.id } ?? scrapbook
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            List {
                nearbyPeersSection
                inviteLinkSection
                inviteEmailSection

                if !currentBook.collaborators.isEmpty {
                    Section("Collaborators") {
                        ForEach(currentBook.collaborators) { user in
                            CollaboratorRow(user: user) {
                                viewModel.removeCollaborator(user, from: scrapbook.id)
                            }
                        }
                    }
                }

                Section("Owner") {
                    HStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [.pink, .purple],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                            .frame(width: 36, height: 36)
                            .overlay(
                                Text(String(viewModel.currentUser.displayName.prefix(1)))
                                    .font(.caption.weight(.bold)).foregroundStyle(.white)
                            )
                        VStack(alignment: .leading, spacing: 2) {
                            Text(viewModel.currentUser.displayName).font(.subheadline.weight(.medium))
                            Text("Owner").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "crown.fill").foregroundStyle(.yellow)
                    }
                }
            }
            .navigationTitle("Collaboration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }.fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                if let link = generatedLink {
                    ShareSheet(items: [
                        "Join '\(scrapbook.title)' on Scrapbook!\n\(link.shareURL.absoluteString)"
                    ])
                }
            }
            .alert("Invite Sent", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage)
            }
        }
    }

    // MARK: - Sections

    private var nearbyPeersSection: some View {
        Section {
            HStack {
                Image(systemName: viewModel.collaboration.isAdvertising
                      ? "antenna.radiowaves.left.and.right" : "antenna.radiowaves.left.and.right.slash")
                    .font(.title2)
                    .foregroundStyle(viewModel.collaboration.isAdvertising ? .green : .secondary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Nearby Collaboration").font(.headline)
                    Text(viewModel.collaboration.connectedPeers.isEmpty
                         ? "No peers connected"
                         : "\(viewModel.collaboration.connectedPeers.count) peer(s) connected")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.collaboration.isAdvertising },
                    set: { on in on ? viewModel.collaboration.startSharing() : viewModel.collaboration.stopSharing() }
                ))
            }
            .padding(.vertical, 4)

            if !viewModel.collaboration.connectedPeers.isEmpty {
                ForEach(viewModel.collaboration.connectedPeers, id: \.displayName) { peer in
                    HStack {
                        Circle().fill(Color.green.opacity(0.2)).frame(width: 8, height: 8)
                        Text(peer.displayName).font(.subheadline)
                    }
                }
            }
        } header: {
            Text("Real-Time Sync")
        }
    }

    private var inviteLinkSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: "link.circle.fill").font(.title2).foregroundStyle(.pink)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Share Invite Link").font(.headline)
                        Text("Anyone with this link can join").font(.caption).foregroundStyle(.secondary)
                    }
                }
                Picker("Permission", selection: $selectedRole) {
                    Text("Can Edit").tag(ScrapbookUser.UserRole.editor)
                    Text("Can View").tag(ScrapbookUser.UserRole.viewer)
                }
                .pickerStyle(.segmented)

                Button {
                    generatedLink = viewModel.inviteCollaborator(email: "", role: selectedRole, to: scrapbook.id)
                    showingShareSheet = true
                } label: {
                    Label("Generate Link", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity).padding(.vertical, 10)
                }
                .buttonStyle(.borderedProminent).tint(.pink)
            }
            .padding(.vertical, 8)
        }
    }

    private var inviteEmailSection: some View {
        Section("Invite by Email") {
            HStack {
                Image(systemName: "envelope").foregroundStyle(.secondary)
                TextField("Email address", text: $emailInput)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .textContentType(.emailAddress)
            }
            Button {
                let email = emailInput.trimmingCharacters(in: .whitespaces)
                guard !email.isEmpty else { return }
                _ = viewModel.inviteCollaborator(email: email, role: selectedRole, to: scrapbook.id)
                alertMessage = "Invite sent to \(email) as \(selectedRole.displayName)."
                showAlert = true
                emailInput = ""
            } label: {
                Label("Send Invite", systemImage: "paperplane.fill")
            }
            .disabled(emailInput.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }
}

// MARK: - Collaborator Row

struct CollaboratorRow: View {
    let user: ScrapbookUser
    let onRemove: () -> Void

    var body: some View {
        HStack {
            Circle().fill(Color(.systemGray4)).frame(width: 36, height: 36)
                .overlay(
                    Text(String(user.displayName.prefix(1)))
                        .font(.caption.weight(.bold)).foregroundStyle(.primary)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text(user.displayName).font(.subheadline.weight(.medium))
                Text(user.email).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(user.role.displayName)
                .font(.caption).padding(.horizontal, 8).padding(.vertical, 4)
                .background(Color(.systemGray5)).clipShape(Capsule())
        }
        .swipeActions {
            Button(role: .destructive, action: onRemove) {
                Label("Remove", systemImage: "person.badge.minus")
            }
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    CollaborationPanelView(scrapbook: Scrapbook(title: "My Scrapbook", ownerId: "user1"))
        .environmentObject(ScrapbookViewModel())
}
