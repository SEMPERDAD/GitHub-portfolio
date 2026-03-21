import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var store: AppStore
    @State private var profile: UserProfile = UserProfile()

    var initials: String {
        let parts = profile.fullName.split(separator: " ")
        if parts.count >= 2 {
            return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased()
        }
        let s = profile.fullName.trimmingCharacters(in: .whitespaces)
        return s.isEmpty ? "?" : String(s.prefix(2)).uppercased()
    }

    var body: some View {
        NavigationStack {
            List {
                avatarHeader
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                    .listRowSeparator(.hidden)

                Section("Personal Info") {
                    TextField("Full Name", text: $profile.fullName)
                    TextField("Email", text: $profile.email)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    TextField("Phone", text: $profile.phone)
                        .keyboardType(.phonePad)
                }

                Section("Online Presence") {
                    TextField("LinkedIn URL", text: $profile.linkedIn)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    TextField("Portfolio / Website URL", text: $profile.portfolioURL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section {
                    NavigationLink("Edit Cover Letter Template") {
                        CoverLetterTemplateView(template: $profile.coverLetterTemplate)
                    }
                } header: {
                    Text("Cover Letter")
                } footer: {
                    Text("Use {{Company}}, {{Position}}, {{YourName}}, {{ContactName}}, and {{CustomParagraph}} as placeholders.")
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Save") { store.saveProfile(profile) }
                        .fontWeight(.semibold)
                        .foregroundStyle(Brand.violet)
                }
            }
            .onAppear { profile = store.profile }
        }
    }

    // MARK: - Avatar Header

    var avatarHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Brand.heroGradient)
                    .frame(width: 88, height: 88)
                    .shadow(color: Brand.violet.opacity(0.4), radius: 12, x: 0, y: 4)
                Text(initials)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
            }

            if !profile.fullName.isEmpty {
                Text(profile.fullName)
                    .font(.title3.bold())
            }

            if !profile.email.isEmpty {
                Text(profile.email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            // Application stats strip
            let appCount = store.applications.count
            let offerCount = store.applications.filter { $0.status == .offer }.count
            let interviewCount = store.applications.filter { $0.status == .interview }.count

            HStack(spacing: 0) {
                miniStat(value: "\(appCount)", label: "Applied")
                Divider().frame(height: 24)
                miniStat(value: "\(interviewCount)", label: "Interviews")
                Divider().frame(height: 24)
                miniStat(value: "\(offerCount)", label: "Offers")
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
            .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }

    private func miniStat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.headline.bold())
                .foregroundStyle(Brand.violet)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct CoverLetterTemplateView: View {
    @Binding var template: String

    var body: some View {
        TextEditor(text: $template)
            .font(.body)
            .padding(8)
            .navigationTitle("Cover Letter Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Reset") {
                        template = UserProfile().coverLetterTemplate
                    }
                    .foregroundStyle(.red)
                }
            }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AppStore())
}
