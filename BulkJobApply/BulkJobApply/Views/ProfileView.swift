import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var store: AppStore
    @State private var profile: UserProfile = UserProfile()
    @State private var isEditing = false

    var body: some View {
        NavigationStack {
            Form {
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
                    Button("Save") {
                        store.saveProfile(profile)
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                profile = store.profile
            }
        }
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
