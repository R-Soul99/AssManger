---
phase: 01-foundation-database-setup
status: in_progress
---

# Phase 01 User Acceptance Testing (UAT)

## Overview
This document tracks the UAT for Phase 01: Foundation & Database Setup. The goal is to verify that the core application scaffolding, database setup, and project management UI features are functioning as expected from a user's perspective.

## Test Cases

### Test 1: Tauri Application Launch
- **Description:** Verify the Tauri application launches successfully and displays the initial UI.
- **Status:** passed
- **Result:** Rust toolchain (rustc 1.93.0, cargo 1.93.0) verified. Application launches successfully.


### Test 2: Project Creation Dialog
- **Description:** Verify that the "Create Project" button opens a dialog allowing the user to choose a location for a new database file.
- **Expected Behavior:** Clicking "Create Project" brings up a file dialog to select a directory and enter a file name.
- **Status:** pending
- **Result:**

### Test 3: Cloud-Synced Folder Warning
- **Description:** Verify that attempting to create a project in a recognized cloud-synced folder (e.g., OneDrive, Dropbox) triggers a warning to the user.
- **Expected Behavior:** A warning message or dialog appears when a cloud-synced folder is selected for project creation.
- **Status:** pending
- **Result:**

### Test 4: Recommended Project Location
- **Description:** Verify that the application suggests or defaults to a recommended project location within the user's AppData directory (or equivalent).
- **Expected Behavior:** The "Create Project" dialog or a related UI element indicates a safe, local path within AppData.
- **Status:** pending
- **Result:**

### Test 5: UI Styling and Functionality
- **Description:** Verify that the project management UI (create, open, recent projects) displays correctly and is visually functional.
- **Expected Behavior:** Buttons, dialogs, and lists are properly styled and respond to user interactions (e.g., clicks, hover).
- **Status:** pending
- **Result:**

### Test 6: Project Creation Success
- **Description:** Verify that a new database file is successfully created at the chosen location when the user confirms creation, and the application transitions to a new state indicating an open project.
- **Expected Behavior:** A new `.assetmap` file (or similar) is created, and the application UI updates to show the newly created project as active.
- **Status:** pending
- **Result:**

### Test 7: Open Existing Project Dialog
- **Description:** Verify that the "Open Project" button opens a file dialog allowing the user to select an existing database file.
- **Expected Behavior:** Clicking "Open Project" brings up a file dialog to select an existing `.assetmap` file.
- **Status:** pending
- **Result:**

### Test 8: Opening Existing Project Success
- **Description:** Verify that an existing project can be opened successfully, and the application UI updates to show the opened project as active.
- **Expected Behavior:** Selecting an existing `.assetmap` file loads the project, and the UI reflects the open project.
- **Status:** pending
- **Result:**

### Test 9: Recent Projects List
- **Description:** Verify that recently opened projects are displayed in a list on the welcome screen or a similar location, and that the list tracks up to 5 projects.
- **Expected Behavior:** A list of recently accessed projects is visible, updating as new projects are opened, and maintaining a maximum of 5 entries.
- **Status:** pending
- **Result:**

### Test 10: Open Project from Recent List
- **Description:** Verify that clicking on a project in the "Recent Projects" list successfully opens that project.
- **Expected Behavior:** Clicking a recent project entry loads the associated project.
- **Status:** pending
- **Result:**
