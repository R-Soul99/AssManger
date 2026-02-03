---
phase: 02-location-hierarchy-and-categories
created_at: 2026-01-31
---

# Phase 02: Location Hierarchy & Categories Context

## Summary

This document captures key user experience and functional decisions for Phase 02, ensuring that subsequent research and planning align with the user's vision.

## Discussed Areas and Decisions

### 1. Location Hierarchy Management

*   **Visualization**: The location hierarchy (`Site > Building > Floor > Room`) will be displayed using a file explorer-style tree view.
*   **Creation**: Locations can be added flexibly via a general "Add Location" button (leading to a form) or through a right-click context menu within the tree view, allowing contextual additions (e.g., "Add Floor" on a Building).
*   **Editing & Moving**: Renaming and moving locations will be managed through a right-click context menu on a location in the tree, offering options like "Rename" and "Move to...". A distinct "edit mode" should be considered to prevent accidental drag-and-drop mistakes, especially during re-parenting.
*   **At-a-Glance Information**: Initially, only the location name is required to be visible in the tree view. The UI should be designed to accommodate additional information (e.g., asset count, location code) as a future enhancement, but this is not a requirement for initial delivery.
*   **Deferred Idea**: Dragging a box around a floorplan section to "save as location" is a valuable idea for a future phase and will be considered during floor plan interaction development.

### 2. Category Definition & Styling

*   **Icon Source**: Users will select category icons from a pre-defined library. The system will also provide an option to customize categories with user-uploaded image files.
*   **Color Selection**: Both a simple, curated color palette and a full color picker (including hex input) will be available for users to define category colors.
*   **Styling Application**: Category icons and colors will be applied consistently across both the location hierarchy tree (e.g., color-coded tree items) and for markers displayed on the floor plan viewer, ensuring clear visual distinction and coherence.
*   **Default Categories**: New projects will offer a choice of category templates, including a blank template for a fresh start, and some pre-defined sets (e.g., common equipment types).

### 3. Error Handling & Data Integrity

*   **Deletion of Parent Locations**: When a user attempts to delete a parent location (e.g., a Building with Floors), the system will issue a warning. The user will be given a choice to either:
    1.  Proceed with a cascading delete, removing all child locations and their associated assets.
    2.  "Orphan" the children, which will leave them in place but remove their parent association.
*   **Deletion of Associated Data (Categories)**: If a category is deleted, the system will issue a warning. All assets previously assigned to the deleted category will be automatically reassigned to a designated 'default' category.
*   **Invalid Hierarchy Moves**: Any attempt to move a location that would violate the established `Site > Building > Floor > Room` hierarchy (e.g., moving a Site under a Building) will be prevented, and an appropriate error message will be displayed.
*   **Empty Location Names**: Location names are permitted to be empty.
*   **Deferred Idea**: The ability to add an additional hierarchy level, such as "Section" within a "Room," is a valuable future enhancement but falls outside the scope of Phase 2.

### 4. Initial Setup Experience

*   **Blank Project Display**: The application will feature a three-pane layout for a new, empty project:
    *   **Left Pane**: An empty, file-explorer-style tree view for the location hierarchy, accompanied by an "Add" button to create the first location.
    *   **Middle Pane**: A blank floor plan display, including an "Add" button and toolbars with editing tools.
    *   **Right Pane**: A "Details" pane designed to display and allow full editing of all data fields for any selected object within the application.
*   **First Location Guidance**: When adding the first location, the system will utilize a generic "Add Location" dialog. This dialog will intelligently prompt for missing parent locations when a child is attempted to be created (e.g., a Floor without a Building), advising a top-down build.
*   **First Category Guidance**: The user will be presented directly with the full category creation UI.
*   **Implicit Creation**: If a user attempts to create a child location (e.g., a Floor) without its required parent(s) (e.g., a Building and Site) already existing, the system will prompt the user to create the missing parents first and advise building the hierarchy top-down. However, the system will also allow the user to bypass this and create orphaned locations, with the understanding that they can be re-parented later using the "Move to..." functionality.
