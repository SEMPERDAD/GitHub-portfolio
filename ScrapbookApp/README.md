# Scrapbook App for iPhone

A beautiful, feature-rich scrapbooking app built with SwiftUI for iPhone.

## Features

### 📸 Photo Import
- Import multiple photos at once from your iPhone photo library using the native `PhotosUI` framework
- Drag, rotate, and scale photos freely on each scrapbook page
- Polaroid-style photo frames with captions
- Support for up to 20 photos per import session

### 👥 Invite Collaborators
- Share scrapbooks with friends and family via invite links
- Set permissions: **Can Edit** or **Can View**
- Invite by email with one tap
- Links expire after 7 days for security
- Manage collaborators — remove access at any time

### 🖨️ Print Photos
- Print photos directly from the app using `UIPrintInteractionController`
- Choose print layouts: 1, 2, or 4 photos per page
- Select specific pages or print the entire scrapbook
- **Save as PDF** and share via AirDrop, Mail, or Files
- Toggle captions on/off for printed output

### 📖 Scrapbook Editor
- Multi-page scrapbooks with customizable page titles
- Interactive canvas — drag, pinch to zoom, rotate items with gestures
- Paper-textured background with dot grid
- Delete items with a tap when in edit mode

## Requirements

- iOS 17.0+
- Xcode 15.0+
- iPhone (portrait orientation)

## Setup

1. Clone this repository
2. Open `ScrapbookApp.xcodeproj` in Xcode
3. Select your development team in **Signing & Capabilities**
4. Build and run on a device or simulator

## Permissions

The app requests the following permissions:

| Permission | Reason |
|---|---|
| Photo Library | Import photos into scrapbooks |
| Camera | Take photos directly in the app |
| Photo Library Add | Save scrapbook pages to camera roll |

## Architecture

```
ScrapbookApp/
├── ScrapbookAppApp.swift        # App entry point
├── ContentView.swift            # Root navigation
├── Models/
│   ├── Scrapbook.swift          # Main scrapbook model
│   ├── ScrapbookPage.swift      # Page & item models
│   └── ScrapbookUser.swift      # User & invite models
├── ViewModels/
│   └── ScrapbookStore.swift     # ObservableObject data store
├── Views/
│   ├── HomeView.swift           # Scrapbook grid dashboard
│   ├── ScrapbookDetailView.swift# Page viewer with toolbar
│   ├── PageCanvasView.swift     # Interactive photo canvas
│   ├── PhotoPickerView.swift    # Photo import sheet
│   ├── InviteView.swift         # Collaborator management
│   └── PrintPreviewView.swift   # Print / PDF export
└── Resources/
    ├── Assets.xcassets
    └── Info.plist
```

## Frameworks Used

- **SwiftUI** — Declarative UI
- **PhotosUI** — `PHPickerViewController` for photo selection
- **UIKit** — `UIPrintInteractionController`, `UIActivityViewController`
- **Foundation** — Data persistence with `UserDefaults`
