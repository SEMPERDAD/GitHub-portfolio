import Foundation

struct UserProfile: Codable {
    var fullName: String = ""
    var email: String = ""
    var phone: String = ""
    var linkedIn: String = ""
    var portfolioURL: String = ""
    var coverLetterTemplate: String = """
Hi {{ContactName}},

I am writing to express my interest in the {{Position}} role at {{Company}}. \
With my background and passion for excellence, I believe I would be a strong \
addition to your team.

{{CustomParagraph}}

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
{{YourName}}
"""

    /// Fills in the cover letter template for a specific job.
    func coverLetter(for job: JobOpportunity, customParagraph: String = "") -> String {
        coverLetterTemplate
            .replacingOccurrences(of: "{{Company}}", with: job.company)
            .replacingOccurrences(of: "{{Position}}", with: job.position)
            .replacingOccurrences(of: "{{YourName}}", with: fullName)
            .replacingOccurrences(of: "{{ContactName}}", with: job.contactEmail.isEmpty ? "Hiring Manager" : job.contactEmail)
            .replacingOccurrences(of: "{{CustomParagraph}}", with: customParagraph)
    }
}
