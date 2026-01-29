# Visual Asset Mapper

## 1. Vision and overview

I want a desktop or web application for equipment **asset management** that lets me import floor plans or diagrams, visually place equipment on them, measure distances using a calibrated scale, and then quickly retrieve details later.

The application should:

- Import floor plans/diagrams (per building/floor/area).
- Let me place and move asset markers on those plans.
- Allow me to calibrate the floor plan scale so I can measure real‑world distances (e.g. corridor lengths).
- Store rich, structured data about equipment (category, location, asset number, phone number, notes, status, etc.).
- Make it easy to search, filter, and export this data to CSV for use in Excel.
- Store its database in a way that can live in cloud‑synced folders (e.g. OneDrive/SharePoint).
- Be designed so it can scale from a single user to **hundreds of users** over time (e.g. team or organisation‑wide use, potentially NHS context).
- Potentially integrate with Microsoft Teams later (open the app or deep‑link into assets/floor plans).

Initially this is a personal/home project, but it should be architected so that scaling up (more users, shared data, better auth) is straightforward.

---

## 2. Target users and usage scenarios

### 2.1 Users

- Primary: Me, working on a Windows PC (home, possibly work later).
- Secondary (future): A small team (5–20 people) sharing the same dataset.
- Long‑term (stretch): A larger team of 100–300 people, potentially across multiple sites.

### 2.2 Example scenarios

- I open a floor plan for Building A, Floor 2, and instantly see where all phones/PCs/clinical devices are located.
- I click a marker for a phone in a ward and see its asset number, extension, serial, and notes.
- I measure the distance between two points on a ward corridor (e.g. for cable runs or equipment spacing).
- I filter the asset list to show all devices in “Building B, Imaging Department” with status “Needs service”.
- I export all “Telephone” assets to CSV, open them in Excel, and bulk‑edit or analyse.
- I store the asset database file in a OneDrive/SharePoint location so it syncs between my home PC and work PC.
- In the future, colleagues open the same dataset from Teams or a web URL and quickly look up assets.

---

## 3. Platform and architecture preferences

I’m flexible on exact tech stack, but:

- Must run well on Windows.
- Can be either:
  - A desktop app (e.g. Electron or .NET desktop UI) backed by a local/remote database, or
  - A web app (SPA + backend API) that I run locally or host somewhere simple.

General preferences:

- Clear, maintainable project structure over cleverness.
- Relational data model (SQLite/PostgreSQL style) with clean CSV export.
- Designed so that a future “multi‑user server + clients” model is possible (e.g. migrate from SQLite file to Postgres with minimal changes to domain model).

For now, assume:

- **Single‑user, file‑based DB** (e.g. SQLite) stored on disk, with the path configurable.
- The database file can live in a cloud‑synced folder (OneDrive/SharePoint sync client) without the app needing to manage sync itself.
- The UI and data‑access layers are separated so we can later point the app at a multi‑user database (e.g. hosted Postgres).

---

## 4. Functional requirements

### 4.1 Core entities

1. **Location hierarchy**
   - Sites (e.g. “Southmead Hospital”, “Home Office”).
   - Buildings (within sites).
   - Floors.
   - Rooms/areas.
   - Each asset belongs to one room/area, which implies a building, floor, and site.

2. **Equipment categories**
   - Examples: Telephone, PC, Printer, Clinical Device, Network Switch, Misc.
   - Category fields:
     - Name.
     - Description.
     - Optional default icon/marker style.
     - Optional default fields/metadata flags.

3. **Assets**
   - Fields (initial set):
     - Asset ID / tag (string).
     - Category (foreign key).
     - Location (room/area, foreign key).
     - Description / name.
     - Serial number.
     - Phone number or extension (optional).
     - Status (e.g. Active, Pending install, Decommissioned, Faulty).
     - Owner / cost centre / team (optional).
     - Notes (free text).
     - Created/updated timestamps.

4. **Floor plans**
   - A floor plan belongs to a building + floor.
   - Data:
     - Identifier (e.g. “Southmead Main Block – Level 2”).
     - Site, building, floor.
     - Underlying image file (PNG/JPEG; PDFs maybe later).
     - Image dimensions / DPI.
     - Scale information:
       - Real‑world units (e.g. metres/feet).
       - Units per pixel or a scale ratio (e.g. 1:100).
       - Optional calibration data: two reference points and known distance.
     - Version / last updated timestamp.
     - Notes.

5. **Asset markers / placements**
   - Link between an asset and a floor plan + coordinates.
   - Data:
     - Asset ID (FK).
     - Floor plan ID (FK).
     - X/Y coordinates (normalised or pixel).
     - Optional orientation.
     - Optional label/tooltip override.

---

### 4.2 Key features

1. **Project and database management**
   - Create/open an “asset project” which uses a specific database file.
   - Choose a DB file path (local folder or something under OneDrive/SharePoint sync).
   - Remember recent projects.
   - Basic backup/export option (copy DB file and/or export CSVs).

2. **Location and category management**
   - CRUD for sites, buildings, floors, rooms.
   - CRUD for categories.
   - Validation to prevent broken data (e.g. room without building).

3. **Asset management**
   - Create/edit/delete assets via forms.
   - Associate each asset with a category and a room/location.
   - Simple list/grid view:
     - Columns: category, location, asset ID, description, status, phone, etc.
     - Sorting and basic filtering (by site/building/floor/room/category/status).
   - Asset detail view with full info and linked markers.

4. **Floor plan import and management**
   - Import image files as floor plans.
   - Assign each floor plan to a site/building/floor.
   - View floor plan with:
     - Pan/zoom.
     - Toggle marker visibility by category or status.
   - **Scale calibration workflow**:
     - When importing or editing a floor plan, provide a “Calibrate scale” tool:
       - Click two points on the image corresponding to a known real‑world distance (e.g. a 10 m corridor).
       - Enter the real distance and units (e.g. 10 m).
       - Store this calibration as units‑per‑pixel or scale ratio.

5. **Placing and editing asset markers**
   - On a floor plan:
     - Add a marker and link it to an existing asset, or
     - Create a new asset directly from the map.
   - Move and delete markers.
   - Clicking a marker opens a small info panel with key asset details and a link to full asset view.

6. **Measurement tools**
   - Allow drawing a line between two points on the floor plan.
   - Use the stored scale (units‑per‑pixel or ratio) to calculate and display the real‑world distance.
   - Optionally support:
     - Snap to horizontal/vertical.
     - Show distance label along the measurement line.

7. **Search and filtering**
   - Global search bar (by asset ID, description, serial, phone number).
   - Advanced filters on the asset list:
     - Site/building/floor/room.
     - Category.
     - Status.
   - Optionally sync filters with floor‑plan markers (e.g. only show “Telephones with status = Faulty”).

8. **CSV export (and future import)**
   - Export:
     - Assets table to CSV.
     - Locations/categorical tables to CSV.
     - Optionally markers/floor‑plan metadata to CSV.
   - Keep schemas and code structured so a future CSV **import** feature is straightforward:
     - Column names stable and human‑readable.
     - Use IDs that are stable across exports/imports.

9. **Cloud‑friendly storage**
   - DB file is a single file that can be stored anywhere.
   - App exposes:
     - “Open database…” which lets me pick a file path.
     - “Save as…” to copy/relocate the DB.
   - Explicitly support paths that are under OneDrive/SharePoint‑synced folders.

10. **Teams and large‑team readiness (later)**
    - Not needed in first versions, but design for:
      - Possible central service/API later (multi‑user).
      - Deep links like `assetmapper://asset/{id}` or web URLs that could be opened from Teams.
    - Optionally: generate simple HTML reports or shareable snapshots that can be posted into Teams.

---

## 5. Non‑functional requirements

- **Maintainability**: Clear folder structure, separate concerns (UI, domain, persistence).
- **Portability**: Able to move the DB file between machines (Windows) with minimal configuration.
- **Performance**: Should handle:
  - Hundreds of floor plans.
  - Tens of thousands of assets.
  - Hundreds of concurrent users in a future client‑server architecture (stretch goal — design with this in mind).
- **Scalability path**:
  - Start: File‑based SQLite used locally by one user.
  - Next: Shared SQLite in a network/cloud folder for small teams (with caveats).
  - Long‑term: The same domain entities mapped onto a central DB (e.g. Postgres) with an API, leaving UI logic reusable.

---

## 6. Roadmap and phases

### Milestone 1 – Core single‑user asset manager

**Phase 1 – Data model and basic CRUD UI**

Goal: Solid backbone: locations, categories, assets, local DB, and basic screens.

- Design and implement the relational schema for:
  - Sites, buildings, floors, rooms.
  - Categories.
  - Assets.
- Implement persistence using a local DB file (likely SQLite).
- Provide a basic UI for:
  - Managing locations (hierarchy).
  - Managing categories.
  - Creating/editing/deleting assets.
  - Listing assets with sorting and basic filtering.
- Decide on project structure and config files.

**Phase 2 – Floor plans, scale, and asset placement (MVP)**

Goal: First useful visual map with markers linked to assets and calibrated measurements.

- Implement floor plan import and storage (image files and metadata).
- Implement a viewer with pan/zoom.
- Implement scale calibration:
  - “Calibrate scale” tool: choose two points and enter real distance + units.
  - Store scale information on the floor plan.
- Allow adding/removing/moving markers on the plan.
- Link markers to existing assets and allow creating new assets from markers.
- Store marker coordinates and link them to the DB entities.
- Simple marker styling per category (e.g. colour/icon).
- Implement basic measurement tool:
  - Draw line between two points.
  - Show distance based on the stored scale.

---

### Milestone 2 – Search, filtering, and CSV

**Phase 3 – Advanced search and CSV export**

Goal: Make data easy to slice and export for reporting/analysis.

- Implement a search bar:
  - Search by asset ID, description, serial, phone.
- Add more advanced filters:
  - Multi‑field filters (e.g. site + category + status).
- Implement CSV export:
  - Assets table.
  - Locations and categories.
  - Optionally markers/floor‑plan info (including scale if useful).
- Ensure exports are compatible with Excel (UTF‑8, headers, predictable formats).

---

### Milestone 3 – Cloud storage and multi‑device

**Phase 4 – Cloud‑friendly DB handling**

Goal: Robust handling of DB files in synced folders; prepare for multi‑user.

- Implement “Open database” and “Create new database” flows with path selection.
- Document and handle basic file‑locking or conflict scenarios for SQLite in OneDrive/SharePoint.
- Optionally add:
  - Read‑only mode when conflicts are detected.
  - “Safe open” checks (e.g. warn if DB is open elsewhere).
- Provide explicit documentation/UX copy about recommended usage:
  - Single‑writer pattern, backups, etc.
- Prepare abstraction layer so persistence could later target a central DB.

---

### Milestone 4 – Collaboration and Teams (future)

**Phase 5 – Collaboration features and Teams integration**

Goal: Make the app friendlier for teams and future growth.

- Add a simple notion of “projects” or “workspaces” to group related DBs.
- Implement deep links or URLs for assets/floor plans (client‑side for now).
- Explore minimal Teams integration options, e.g.:
  - Launching the app from a Teams tab via URL protocol (desktop).
  - Serving a read‑only web UI inside a Teams tab (if using web stack).
- Consider basic multi‑user features:
  - Audit trails (who changed what, when).
  - Simple role permissions (future planning only; not required in first pass).

---

## 7. Data model (initial sketch)

Conceptual schema to guide implementation:

- `sites`  
  - `id`, `name`, `code`, `notes`

- `buildings`  
  - `id`, `site_id`, `name`, `code`, `notes`

- `floors`  
  - `id`, `building_id`, `name`, `level_number`, `notes`

- `rooms`  
  - `id`, `floor_id`, `name`, `code`, `notes`

- `categories`  
  - `id`, `name`, `description`, `icon`, `color`, `notes`

- `assets`  
  - `id`, `category_id`, `room_id`  
  - `asset_tag`, `serial_number`, `description`  
  - `phone_number`, `status`, `owner`, `cost_centre`  
  - `notes`, `created_at`, `updated_at`

- `floor_plans`  
  - `id`, `building_id`, `floor_id`  
  - `name`, `image_path`, `width_px`, `height_px`  
  - `scale_units`, `units_per_pixel` (or `scale_ratio`)  
  - `calibration_p1_x`, `calibration_p1_y`, `calibration_p2_x`, `calibration_p2_y`, `calibration_distance`  
  - `version`, `notes`

- `markers`  
  - `id`, `asset_id`, `floor_plan_id`, `x`, `y`, `orientation`, `label_override`

This is intentionally simple and CSV‑friendly.

---

## 8. Risks and future considerations

- SQLite in cloud‑synced folders has concurrency limitations; for hundreds of concurrent users, a proper client‑server DB will be needed.
- Large floor plan images and thousands of markers per plan may require performance tuning (e.g. marker clustering, canvas optimisations).
- Measurement accuracy depends on good calibration; UX should make it easy to re‑calibrate and show scale info clearly.
- For scaling to 100–300 users:
  - Keep domain logic and DB access abstracted.
  - Avoid hard‑coding SQLite‑specific quirks so we can swap to Postgres or another RDBMS later.
  - Consider eventual authentication/authorisation model (e.g. Azure AD, NHS SSO) but treat it as out of scope for initial build.

---

## 9. Developer experience and project structure

- Clear separation of:
  - UI components/views.
  - Domain models and business logic.
  - Persistence/repositories.
  - Integration adapters (CSV, cloud file selection, future APIs).
- Automated tasks:
  - Script/command to set up a new environment (dependencies, initial DB migrations).
  - Script/command to run unit tests or basic checks.

---

## 10. Initial GSD phases summary

- **Phase 1**: Data model + CRUD UI for locations, categories, assets; local DB file.  
- **Phase 2**: Floor plan import, scale calibration, measurement tools, and marker placement linked to assets.  
- **Phase 3**: Search/filtering + CSV export.  
- **Phase 4**: DB path selection and cloud‑friendly behaviour.  
- **Phase 5**: Collaboration enhancements and basic Teams‑friendly hooks.

