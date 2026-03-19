import Foundation

struct JobOpportunity: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var company: String
    var position: String
    var jobURL: String
    var contactEmail: String
    var deadline: Date?
    var notes: String
    var dateAdded: Date = Date()

    var displayDeadline: String {
        guard let deadline else { return "No deadline" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: deadline)
    }
}
