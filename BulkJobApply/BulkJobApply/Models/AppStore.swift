import Foundation
import Combine

class AppStore: ObservableObject {
    @Published var jobs: [JobOpportunity] = []
    @Published var applications: [JobApplication] = []
    @Published var profile: UserProfile = UserProfile()

    private let jobsKey        = "savedJobs"
    private let applicationsKey = "savedApplications"
    private let profileKey     = "savedProfile"

    init() {
        load()
    }

    // MARK: - Jobs
    func addJob(_ job: JobOpportunity) {
        jobs.append(job)
        save()
    }

    func updateJob(_ job: JobOpportunity) {
        if let idx = jobs.firstIndex(where: { $0.id == job.id }) {
            jobs[idx] = job
            save()
        }
    }

    func deleteJobs(at offsets: IndexSet) {
        jobs.remove(atOffsets: offsets)
        save()
    }

    // MARK: - Applications
    func submitApplications(for selectedJobs: [JobOpportunity], customParagraph: String) {
        let newApps = selectedJobs.map { job in
            JobApplication(
                job: job,
                status: .sent,
                coverLetter: profile.coverLetter(for: job, customParagraph: customParagraph),
                dateApplied: Date()
            )
        }
        applications.append(contentsOf: newApps)
        save()
    }

    func updateApplication(_ app: JobApplication) {
        if let idx = applications.firstIndex(where: { $0.id == app.id }) {
            applications[idx] = app
            save()
        }
    }

    func deleteApplications(at offsets: IndexSet) {
        applications.remove(atOffsets: offsets)
        save()
    }

    // MARK: - Profile
    func saveProfile(_ p: UserProfile) {
        profile = p
        save()
    }

    // MARK: - Persistence
    private func save() {
        if let data = try? JSONEncoder().encode(jobs) {
            UserDefaults.standard.set(data, forKey: jobsKey)
        }
        if let data = try? JSONEncoder().encode(applications) {
            UserDefaults.standard.set(data, forKey: applicationsKey)
        }
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: profileKey)
        }
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: jobsKey),
           let decoded = try? JSONDecoder().decode([JobOpportunity].self, from: data) {
            jobs = decoded
        }
        if let data = UserDefaults.standard.data(forKey: applicationsKey),
           let decoded = try? JSONDecoder().decode([JobApplication].self, from: data) {
            applications = decoded
        }
        if let data = UserDefaults.standard.data(forKey: profileKey),
           let decoded = try? JSONDecoder().decode(UserProfile.self, from: data) {
            profile = decoded
        }
    }
}
