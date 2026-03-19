import Foundation

enum ApplicationStatus: String, Codable, CaseIterable {
    case draft     = "Draft"
    case sent      = "Sent"
    case interview = "Interview"
    case offer     = "Offer"
    case rejected  = "Rejected"
    case withdrawn = "Withdrawn"

    var systemImage: String {
        switch self {
        case .draft:     return "doc.badge.clock"
        case .sent:      return "paperplane.fill"
        case .interview: return "person.2.fill"
        case .offer:     return "star.fill"
        case .rejected:  return "xmark.circle.fill"
        case .withdrawn: return "minus.circle.fill"
        }
    }

    var color: String {
        switch self {
        case .draft:     return "gray"
        case .sent:      return "blue"
        case .interview: return "orange"
        case .offer:     return "green"
        case .rejected:  return "red"
        case .withdrawn: return "secondary"
        }
    }
}

struct JobApplication: Identifiable, Codable {
    var id: UUID = UUID()
    var job: JobOpportunity
    var status: ApplicationStatus = .draft
    var coverLetter: String
    var dateApplied: Date = Date()
    var notes: String = ""
    var followUpDate: Date?
}
