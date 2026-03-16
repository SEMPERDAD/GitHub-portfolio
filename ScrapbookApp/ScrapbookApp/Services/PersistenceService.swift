import Foundation

/// Handles JSON-based auto-save and load of all scrapbooks to UserDefaults.
final class PersistenceService {
    private let saveKey = "saved_scrapbooks"

    func save(_ scrapbooks: [Scrapbook]) {
        if let data = try? JSONEncoder().encode(scrapbooks) {
            UserDefaults.standard.set(data, forKey: saveKey)
        }
    }

    func load() -> [Scrapbook] {
        guard let data = UserDefaults.standard.data(forKey: saveKey),
              let decoded = try? JSONDecoder().decode([Scrapbook].self, from: data)
        else { return [] }
        return decoded
    }
}
