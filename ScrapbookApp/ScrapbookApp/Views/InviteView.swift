import SwiftUI
import MessageUI

struct InviteView: View {
    @EnvironmentObject var store: ScrapbookStore
    @Environment(\.dismiss) var dismiss

    let scrapbook: Scrapbook

    @State private var emailInput = ""
    @State private var selectedRole: ScrapbookUser.UserRole = .editor
    @State private var generatedLink: InviteLink?
    @State private var showingShareSheet = false
    @State private var showingMessageCompose = false
    @State private var showAlert = false
    @State private var alertMessage = ""

    private var currentBook: Scrapbook {
        store.scrapbooks.first { $0.id == scrapbook.id } ?? scrapbook
    }

    var body: some View {
        NavigationStack {
            List {
                // Invite by link section
                Section {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "link.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.pink)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Share Invite Link")
                                    .font(.headline)
                                Text("Anyone with this link can join")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Picker("Permission", selection: $selectedRole) {
                            Text("Can Edit").tag(ScrapbookUser.UserRole.editor)
                            Text("Can View").tag(ScrapbookUser.UserRole.viewer)
                        }
                        .pickerStyle(.segmented)

                        Button {
                            generatedLink = store.inviteCollaborator(
                                email: "", role: selectedRole, to: scrapbook.id
                            )
                            showingShareSheet = true
                        } label: {
                            Label("Generate Link", systemImage: "square.and.arrow.up")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.pink)
                    }
                    .padding(.vertical, 8)
                }

                // Invite by email
                Section("Invite by Email") {
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundStyle(.secondary)
                        TextField("Email address", text: $emailInput)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .textContentType(.emailAddress)
                    }

                    Button {
                        sendEmailInvite()
                    } label: {
                        Label("Send Invite", systemImage: "paperplane.fill")
                    }
                    .disabled(emailInput.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                // Current collaborators
                if !currentBook.collaborators.isEmpty {
                    Section("Collaborators") {
                        ForEach(currentBook.collaborators) { user in
                            CollaboratorRow(user: user) {
                                store.removeCollaborator(user, from: scrapbook.id)
                            }
                        }
                    }
                }

                // Owner info
                Section("Owner") {
                    HStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [.pink, .purple],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                            .frame(width: 36, height: 36)
                            .overlay(
                                Text(String(store.currentUser.displayName.prefix(1)))
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.white)
                            )
                        VStack(alignment: .leading, spacing: 2) {
                            Text(store.currentUser.displayName)
                                .font(.subheadline.weight(.medium))
                            Text("Owner")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "crown.fill")
                            .foregroundStyle(.yellow)
                    }
                }
            }
            .navigationTitle("Invite People")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                if let link = generatedLink {
                    ShareSheet(items: [
                        "Join my scrapbook '\(scrapbook.title)' on Scrapbook App!\n\(link.shareURL.absoluteString)"
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

    private func sendEmailInvite() {
        let email = emailInput.trimmingCharacters(in: .whitespaces)
        guard !email.isEmpty else { return }
        let link = store.inviteCollaborator(email: email, role: selectedRole, to: scrapbook.id)
        alertMessage = "Invite sent to \(email). They can join with role: \(selectedRole.displayName)"
        showAlert = true
        emailInput = ""
        _ = link
    }
}

struct CollaboratorRow: View {
    let user: ScrapbookUser
    let onRemove: () -> Void

    var body: some View {
        HStack {
            Circle()
                .fill(Color(.systemGray4))
                .frame(width: 36, height: 36)
                .overlay(
                    Text(String(user.displayName.prefix(1)))
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.primary)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text(user.displayName)
                    .font(.subheadline.weight(.medium))
                Text(user.email)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(user.role.displayName)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.systemGray5))
                .clipShape(Capsule())
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
    InviteView(scrapbook: Scrapbook(title: "My Scrapbook", ownerId: "user1"))
        .environmentObject(ScrapbookStore())
}
