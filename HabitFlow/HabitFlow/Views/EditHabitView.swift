import SwiftUI
import SwiftData

/// Form for editing an existing habit.
struct EditHabitView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Bindable var habit: Habit

    @State private var name: String
    @State private var selectedIcon: String
    @State private var selectedColor: String
    @State private var frequencyType: FrequencyType
    @State private var selectedWeekdays: Set<Int>
    @State private var timesPerWeek: Int
    @State private var reminderEnabled: Bool
    @State private var reminderTime: Date

    enum FrequencyType: String, CaseIterable {
        case daily = "Daily"
        case specificDays = "Specific Days"
        case timesPerWeek = "Times per Week"
    }

    init(habit: Habit) {
        self.habit = habit
        _name = State(initialValue: habit.name)
        _selectedIcon = State(initialValue: habit.iconName)
        _selectedColor = State(initialValue: habit.colorHex)
        _reminderEnabled = State(initialValue: habit.reminderTime != nil)
        _reminderTime = State(initialValue: habit.reminderTime ?? Calendar.current.date(from: DateComponents(hour: 9, minute: 0)) ?? Date())

        switch habit.frequency {
        case .daily:
            _frequencyType = State(initialValue: .daily)
            _selectedWeekdays = State(initialValue: [])
            _timesPerWeek = State(initialValue: 3)
        case .specificDays(let days):
            _frequencyType = State(initialValue: .specificDays)
            _selectedWeekdays = State(initialValue: days)
            _timesPerWeek = State(initialValue: 3)
        case .timesPerWeek(let count):
            _frequencyType = State(initialValue: .timesPerWeek)
            _selectedWeekdays = State(initialValue: [])
            _timesPerWeek = State(initialValue: count)
        }
    }

    var body: some View {
        Form {
            nameSection
            iconSection
            colorSection
            frequencySection
            reminderSection
        }
        .navigationTitle("Edit Habit")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { save() }
                    .fontWeight(.semibold)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }

    // MARK: - Sections (identical layout to AddHabitView)

    private var nameSection: some View {
        Section("Name") {
            TextField("e.g. Morning Run", text: $name)
                .textInputAutocapitalization(.words)
        }
    }

    private var iconSection: some View {
        Section("Icon") {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                ForEach(SFSymbolPicker.icons, id: \.self) { icon in
                    Button(action: { selectedIcon = icon }) {
                        Image(systemName: icon)
                            .font(.title2)
                            .frame(width: 44, height: 44)
                            .background(
                                selectedIcon == icon
                                    ? Color(hex: selectedColor).opacity(0.2)
                                    : Color(.systemGray6)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(selectedIcon == icon ? Color(hex: selectedColor) : .clear, lineWidth: 2)
                            )
                    }
                    .foregroundStyle(selectedIcon == icon ? Color(hex: selectedColor) : .secondary)
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private var colorSection: some View {
        Section("Color") {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 12) {
                ForEach(ColorPalette.presets, id: \.self) { hex in
                    Button(action: { selectedColor = hex }) {
                        Circle()
                            .fill(Color(hex: hex))
                            .frame(width: 36, height: 36)
                            .overlay(
                                Circle()
                                    .stroke(Color.primary, lineWidth: selectedColor == hex ? 3 : 0)
                                    .padding(selectedColor == hex ? -3 : 0)
                            )
                            .overlay {
                                if selectedColor == hex {
                                    Image(systemName: "checkmark")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private var frequencySection: some View {
        Section("Frequency") {
            Picker("Type", selection: $frequencyType) {
                ForEach(FrequencyType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(.segmented)

            switch frequencyType {
            case .daily:
                EmptyView()
            case .specificDays:
                weekdayPicker
            case .timesPerWeek:
                Stepper("\(timesPerWeek) times per week", value: $timesPerWeek, in: 1...7)
            }
        }
    }

    private var weekdayPicker: some View {
        HStack(spacing: 6) {
            ForEach(DateHelper.orderedWeekdays, id: \.self) { day in
                let isSelected = selectedWeekdays.contains(day)
                Button(action: {
                    if isSelected {
                        selectedWeekdays.remove(day)
                    } else {
                        selectedWeekdays.insert(day)
                    }
                }) {
                    Text(DateHelper.shortWeekdayName(day))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 36, height: 36)
                        .background(isSelected ? Color(hex: selectedColor) : Color(.systemGray5))
                        .foregroundStyle(isSelected ? .white : .primary)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.vertical, 4)
    }

    private var reminderSection: some View {
        Section("Reminder") {
            Toggle("Enable Reminder", isOn: $reminderEnabled)
            if reminderEnabled {
                DatePicker("Time", selection: $reminderTime, displayedComponents: .hourAndMinute)
            }
        }
    }

    // MARK: - Save

    private func save() {
        let frequency: HabitFrequency
        switch frequencyType {
        case .daily:
            frequency = .daily
        case .specificDays:
            frequency = selectedWeekdays.isEmpty ? .daily : .specificDays(selectedWeekdays)
        case .timesPerWeek:
            frequency = .timesPerWeek(timesPerWeek)
        }

        let vm = HabitViewModel(modelContext: modelContext)
        vm.updateHabit(
            habit,
            name: name.trimmingCharacters(in: .whitespaces),
            iconName: selectedIcon,
            colorHex: selectedColor,
            frequency: frequency,
            reminderTime: reminderEnabled ? reminderTime : nil
        )

        dismiss()
    }
}

#Preview {
    NavigationStack {
        EditHabitView(habit: Habit(name: "Test", iconName: "star.fill", colorHex: "#1A8C7A"))
    }
    .modelContainer(for: [Habit.self, HabitEntry.self], inMemory: true)
}
