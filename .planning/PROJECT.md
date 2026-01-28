# Visual Asset Mapper

## What This Is

A desktop or web application for equipment asset management that lets users import floor plans or diagrams, visually place equipment on them with calibrated measurements, and quickly retrieve asset details. Designed to scale from single-user to hundreds of users (e.g., NHS organizational use) with cloud-synced storage and potential Microsoft Teams integration.

## Core Value

Visual, spatially-aware asset tracking with calibrated measurements that makes equipment location and details instantly accessible.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Data Model & Location Hierarchy:**
- [ ] Sites, buildings, floors, and rooms hierarchy with CRUD operations
- [ ] Equipment categories with customizable icons, colors, and metadata
- [ ] Assets with comprehensive fields (asset tag, serial, phone/extension, status, owner, cost centre, notes)
- [ ] Relational data model designed for CSV export compatibility

**Floor Plans & Visual Mapping:**
- [ ] Import floor plans (PNG/JPEG) and assign to building/floor
- [ ] Pan/zoom viewer for floor plans
- [ ] Scale calibration workflow (two-point calibration with known distance)
- [ ] Place, move, and delete asset markers on floor plans
- [ ] Link markers to existing assets or create new assets from markers
- [ ] Category-based marker styling (color/icon)
- [ ] Measurement tool using calibrated scale to show real-world distances

**Asset Management:**
- [ ] Create/edit/delete assets via forms
- [ ] List/grid view with sorting and filtering (site/building/floor/room/category/status)
- [ ] Asset detail view showing full info and linked floor plan markers
- [ ] Global search by asset ID, description, serial, phone number

**Data Export:**
- [ ] CSV export for assets table
- [ ] CSV export for locations and categories
- [ ] Excel-compatible exports (UTF-8, headers, predictable formats)
- [ ] Export structured to support future CSV import

**Database & Storage:**
- [ ] Single-file database (SQLite) with configurable path
- [ ] "Open database" and "Create new database" workflows
- [ ] Support for cloud-synced folders (OneDrive/SharePoint)
- [ ] Remember recent projects
- [ ] Basic backup/export option

### Out of Scope

- Real-time multi-user editing — Single-writer pattern for v1, design for future migration
- Mobile app — Web/desktop first, mobile later
- Authentication/authorization — Future consideration for larger teams (Azure AD/NHS SSO)
- PDF floor plan import — Image files (PNG/JPEG) for v1
- Advanced measurement features (area calculation, polygons) — Linear distance measurement for v1
- Video/3D floor plans — 2D images for v1
- Built-in conflict resolution for SQLite in cloud folders — Document best practices, read-only mode as safety measure

## Context

**Target Environment:**
- Primary platform: Windows PC (home and work use)
- Storage: Local file system with cloud sync (OneDrive/SharePoint)
- Future: Potential Microsoft Teams integration and web deployment

**Use Case:**
Equipment asset management across healthcare facilities (NHS context) where physical location on floor plans is critical for operations, maintenance, and planning. Current challenge: no easy way to visually map assets to floor plans with accurate measurements.

**User Journey:**
Single user initially (personal project), scaling to small teams (5-20 people sharing dataset), with long-term vision for larger organizational deployment (100-300 users across multiple sites).

**Example Scenarios:**
- Facility manager opens floor plan, instantly sees all phones/PCs/clinical devices
- Clicking marker shows asset number, extension, serial, notes
- Measuring corridor distance for cable runs or equipment spacing
- Filtering to "Building B, Imaging Department" devices with status "Needs service"
- Exporting all telephones to CSV for bulk analysis in Excel
- Database synced via OneDrive between home and work PC

## Constraints

- **Platform**: Windows (desktop or web app) — Primary user environment
- **Data portability**: Single-file database for easy cloud sync — Enables multi-device, simple backup
- **Scalability architecture**: Must support future migration from SQLite to PostgreSQL/multi-user — Abstracted data access layer required
- **Tech stack**: Relational DB (SQLite → PostgreSQL path), clear project structure — Maintainability over cleverness
- **Performance**: Handle hundreds of floor plans, tens of thousands of assets — Future-proof for organizational scale
- **Excel compatibility**: CSV exports must open cleanly in Excel — Primary data analysis tool for users

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite for v1 database | Single-file, portable, cloud-sync friendly, zero server setup | — Pending |
| File-based storage in cloud folders | Simplest multi-device access without hosting infrastructure | — Pending |
| Abstracted data access layer | Enable future migration to client-server architecture (PostgreSQL) | — Pending |
| Two-point calibration for floor plans | Accurate real-world measurements from arbitrary images | — Pending |
| Hierarchical location model (site→building→floor→room) | Matches physical reality and organizational structure | — Pending |

---
*Last updated: 2026-01-28 after initialization*
