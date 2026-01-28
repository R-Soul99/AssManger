# Feature Research

**Domain:** Visual Asset Management & Floor Plan Mapping for Equipment Tracking
**Researched:** 2026-01-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Asset Management Domain

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Asset inventory listing | All asset management tools show a list/table of assets | LOW | Basic CRUD with searchable list view |
| Asset search/filter | Users expect to find specific assets quickly without scrolling | MEDIUM | Multi-field search (name, type, location, custom fields) |
| Asset location tracking | Core value prop - knowing where equipment physically is | MEDIUM | Must integrate with spatial/floor plan view |
| Asset details/metadata | Users need to record serial numbers, models, purchase dates, costs | LOW | Form-based data entry with validation |
| CSV import/export | Excel is the universal data exchange format for facilities managers | MEDIUM | Must handle common field mappings and validation errors |
| Basic reporting | Users need counts, summaries, and filtered lists for management | LOW | Export filtered views, generate summary statistics |
| Work order/maintenance history | Equipment has maintenance records over time | HIGH | Requires temporal data model, status tracking |
| Preventive maintenance scheduling | Proactive maintenance is expected to prevent breakdowns | HIGH | Requires scheduling engine, notifications, recurring tasks |
| Asset lifecycle tracking | Tracking from acquisition to disposal is standard practice | MEDIUM | Status field (in service, under maintenance, retired) with history |
| User roles and permissions | Multi-user systems must control who can view/edit | MEDIUM | View-only, editor, admin roles minimum |

#### Floor Plan / Spatial Domain

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Import floor plan images | Users have existing CAD/PDF floor plans they want to use | LOW | Support PNG, JPG, PDF import |
| Place equipment markers on floor plan | Visual location is the core feature | MEDIUM | Click to place, drag to reposition, link to asset record |
| Scale calibration | Users need real-world measurements (e.g., "this room is 10m x 12m") | MEDIUM | Two-point calibration: mark known distance, enter actual length |
| Pan and zoom | Large floor plans require navigation | LOW | Standard canvas/viewport controls |
| Hierarchical location structure | Facilities are organized as Site > Building > Floor > Room | MEDIUM | Tree structure with parent-child relationships |
| Room/zone labels | Users need to label areas on floor plans | LOW | Text annotations on canvas |
| Distance measurement tool | "How far is this equipment from that door?" | MEDIUM | Point-to-point measurement using calibrated scale |
| Print/export floor plan view | Users share visual asset maps with stakeholders | MEDIUM | Generate PDF or high-res image of current view |
| Asset marker icons | Different equipment types need visual distinction | LOW | Icon library or color-coding system |
| Multiple floor plan support | Multi-floor buildings require separate plans | MEDIUM | Floor selector, bulk operations across floors |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time multi-device sync | Teams can update floor plans from anywhere, changes sync instantly | HIGH | Cloud-based with conflict resolution, requires backend infrastructure |
| Offline-first with sync | Facility managers work in basements/areas with poor connectivity | HIGH | Local-first architecture with sync when online, complex state management |
| Visual search on floor plan | "Show me all MRI machines" highlights markers on floor plan | MEDIUM | Filter-to-map integration, visual feedback |
| Mobile-optimized floor plan view | Technicians use tablets/phones on the floor | MEDIUM | Touch-friendly controls, responsive design for small screens |
| 3D floor visualization | Visualize assets across multiple floors in 3D stack | HIGH | Requires 3D rendering library, complex UX |
| Heat maps for utilization | Visual density maps showing equipment concentration or usage patterns | HIGH | Analytics layer on top of spatial data |
| Quick asset check-in/out | Track equipment movement with simple mobile workflow | MEDIUM | Mobile-first workflow with QR/barcode scanning |
| Custom asset status badges | Visual indicators for maintenance due, out of service, etc. | LOW | Overlay status icons on floor plan markers |
| Room capacity planning | "Can this room fit 3 more workstations?" with visual space allocation | MEDIUM | Polygon drawing, area calculation, capacity vs. current count |
| Collaborative annotations | Team members can leave notes on floor plan locations | MEDIUM | Per-user or per-role comment layers with timestamps |
| Historical snapshots | "What did the floor plan look like 6 months ago?" | HIGH | Versioning system for floor plan layouts and asset positions |
| Integration with BMS/IoT | Live equipment status from building management systems | VERY HIGH | API integration, real-time data streams, requires hardware support |
| Photo attachments per asset | Visual documentation of equipment condition | MEDIUM | Image storage, compression, gallery view |
| Smart floor plan auto-detection | Upload floor plan, AI detects rooms/walls/doors automatically | VERY HIGH | ML/computer vision, unreliable for greenfield MVP |
| QR code generation per asset | Print labels for physical equipment linking to digital record | LOW | QR library, print-friendly format |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time location tracking (GPS/RFID) | "Know exactly where equipment is at all times" | Requires expensive hardware infrastructure, battery management, maintenance overhead, privacy concerns | Manual location updates when equipment moves + visual floor plan verification |
| Built-in CAD floor plan editor | "Let users draw floor plans from scratch" | Massive scope, duplicates existing CAD tools, complex UX, won't match professional tools | Import existing floor plans from CAD exports (DWG/PDF), focus on asset layer not plan creation |
| Mobile app (native iOS/Android) | "Need a dedicated app" | 2-3x development cost, app store approval delays, separate update cycles | Progressive Web App (PWA) with mobile-optimized responsive design, works across all devices |
| Real-time collaboration (Google Docs style) | "See other users' cursors moving live" | Complex operational transform/CRDT logic, websocket infrastructure, rare collision scenarios | Optimistic updates with last-write-wins + change log showing recent edits |
| Unlimited custom fields per asset | "Every organization is different" | Database schema bloat, UI becomes cluttered, poor performance with sparse data | Fixed schema with 3-5 user-defined fields + notes field for edge cases |
| Integration marketplace | "Connect to everything" | Each integration is a maintenance burden, breaks frequently with API changes | CSV import/export as universal adapter + Zapier/Make.com for power users |
| Blockchain asset tracking | "Immutable audit trail" | Complexity without clear benefit, vendor lock-in, performance overhead | Standard append-only audit log in relational DB, export to CSV for external audit |
| AR floor plan overlay | "Hold phone up and see equipment in real space" | Requires AR SDK, device-specific issues, calibration drift, gimmick without clear workflow benefit | Photo attachments showing equipment in situ, standard 2D floor plan is sufficient |
| Advanced analytics/BI dashboard | "See trends and insights" | Premature for early stage, most users just want basic counts and lists | Export to CSV, let users analyze in Excel/Power BI where they're comfortable |
| Automated equipment detection | "Camera scans room and identifies equipment" | Computer vision is unreliable, requires training data, high error rate | Manual marker placement with optional QR code scanning for verification |

## Feature Dependencies

```
[Scale Calibration]
    └──requires──> [Floor Plan Import]

[Distance Measurement Tool]
    └──requires──> [Scale Calibration]
                       └──requires──> [Floor Plan Import]

[Place Equipment Markers]
    └──requires──> [Floor Plan Import]
    └──requires──> [Asset Inventory]

[Hierarchical Locations]
    └──required by──> [Asset Location Tracking]
    └──required by──> [Multiple Floor Plan Support]

[User Roles/Permissions]
    └──required by──> [Multi-User/Team Features]
    └──required by──> [Real-time Multi-Device Sync]

[Asset Search/Filter] ──enhances──> [Visual Search on Floor Plan]

[Mobile-Optimized View] ──enhances──> [Quick Asset Check-in/Out]

[Photo Attachments] ──enhances──> [Asset Details/Metadata]

[Offline-First] ──conflicts with──> [Real-time Collaboration (Google Docs style)]
```

### Dependency Notes

- **Scale Calibration requires Floor Plan Import:** Can't calibrate a floor plan that doesn't exist yet; calibration is a configuration step after import
- **Distance Measurement requires Scale Calibration:** Measurements are meaningless without knowing the scale ratio between pixels and real-world units
- **Equipment Markers require both Floor Plan and Asset Inventory:** Markers link spatial position to asset records; both systems must exist
- **Hierarchical Locations required by Location Tracking:** Asset location references the hierarchy (e.g., "Building A > Floor 2 > Room 204"); the structure must exist first
- **User Roles required by Multi-User Features:** Can't have team collaboration without access control defining who can do what
- **Visual Search enhances Floor Plan:** Filtering assets in the inventory and highlighting them on the floor plan creates powerful spatial queries
- **Mobile View enhances Check-in/Out:** Mobile workflow is most useful with touch-optimized interface for field use
- **Photo Attachments enhance Asset Details:** Visual documentation adds context to text metadata
- **Offline-First conflicts with Real-time Collaboration:** True offline-first (local storage as source of truth) makes real-time cursor sharing impossible; requires architectural choice

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Asset Inventory CRUD** — Single user must be able to create, read, update, delete assets with basic fields (name, type, serial number, location)
- [ ] **Hierarchical Location Structure** — Define Site > Building > Floor > Room hierarchy to organize assets spatially
- [ ] **Import Floor Plan Image** — Upload PNG/JPG floor plan images to use as spatial canvas
- [ ] **Scale Calibration** — Two-point calibration to set real-world scale (click two points, enter distance)
- [ ] **Place Equipment Markers** — Click floor plan to place markers, link to asset records, drag to reposition
- [ ] **Asset Search/Filter** — Search assets by name, type, location; filter inventory list
- [ ] **CSV Export** — Export filtered asset list to CSV for Excel analysis
- [ ] **Pan and Zoom** — Navigate large floor plans with standard viewport controls
- [ ] **Distance Measurement Tool** — Point-to-point measurement using calibrated scale
- [ ] **Asset Marker Icons/Colors** — Visual distinction for different equipment types

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **CSV Import** — Bulk import existing asset inventory from Excel (trigger: users have existing data to migrate)
- [ ] **Multi-User with Basic Roles** — Add users with view-only/editor/admin permissions (trigger: 2+ users need concurrent access)
- [ ] **Cloud Storage Sync** — Sync local data to cloud for multi-device access (trigger: user needs to access from multiple devices)
- [ ] **Mobile-Optimized View** — Touch-friendly floor plan navigation and asset lookup (trigger: field technician needs tablet/phone access)
- [ ] **Asset Status Tracking** — In service, under maintenance, retired states with visual badges on floor plan (trigger: maintenance workflows emerge)
- [ ] **Photo Attachments** — Attach images to assets for visual documentation (trigger: users want condition photos)
- [ ] **Room/Zone Labels** — Text annotations on floor plan for room identification (trigger: floor plans lack room labels)
- [ ] **Print/Export Floor Plan View** — Generate PDF of floor plan with asset markers (trigger: user needs to share visual map)
- [ ] **Visual Search on Floor Plan** — Filter assets and highlight markers on floor plan (trigger: "show me all X-ray machines" requests)
- [ ] **Multiple Floor Plans per Location** — Support multi-floor buildings (trigger: user has 2+ floors to map)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Preventive Maintenance Scheduling** — Defer until usage patterns show maintenance tracking is critical workflow
- [ ] **Work Order Management** — Defer until user requests explicit maintenance workflow vs. just location tracking
- [ ] **Advanced Analytics/Reporting** — Defer until users ask for more than CSV export; let them use Excel first
- [ ] **3D Floor Visualization** — Defer until multi-floor use case is validated and users request better vertical navigation
- [ ] **Offline-First Architecture** — Defer until field use without connectivity is validated need
- [ ] **QR Code Scanning** — Defer until mobile check-in/out workflow is established
- [ ] **Integration with BMS/IoT** — Defer until enterprise customers with existing building management systems emerge
- [ ] **Historical Snapshots** — Defer until change management and audit requirements surface
- [ ] **Collaborative Annotations** — Defer until multi-user collaboration patterns emerge organically
- [ ] **Heat Maps** — Defer until spatial analytics use cases are validated

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Asset Inventory CRUD | HIGH | LOW | P1 |
| Place Equipment Markers | HIGH | MEDIUM | P1 |
| Floor Plan Import | HIGH | LOW | P1 |
| Scale Calibration | HIGH | MEDIUM | P1 |
| Hierarchical Locations | HIGH | MEDIUM | P1 |
| Asset Search/Filter | HIGH | MEDIUM | P1 |
| CSV Export | HIGH | MEDIUM | P1 |
| Pan and Zoom | HIGH | LOW | P1 |
| Distance Measurement | MEDIUM | MEDIUM | P1 |
| Asset Marker Icons | MEDIUM | LOW | P1 |
| CSV Import | MEDIUM | MEDIUM | P2 |
| Multi-User Roles | HIGH | MEDIUM | P2 |
| Cloud Storage Sync | HIGH | HIGH | P2 |
| Mobile-Optimized View | MEDIUM | MEDIUM | P2 |
| Asset Status Tracking | MEDIUM | MEDIUM | P2 |
| Photo Attachments | MEDIUM | MEDIUM | P2 |
| Room/Zone Labels | LOW | LOW | P2 |
| Export Floor Plan View | LOW | MEDIUM | P2 |
| Visual Search on Floor Plan | HIGH | MEDIUM | P2 |
| Multiple Floor Plans | MEDIUM | MEDIUM | P2 |
| Preventive Maintenance | HIGH | HIGH | P3 |
| Work Order Management | HIGH | HIGH | P3 |
| Advanced Analytics | MEDIUM | HIGH | P3 |
| 3D Visualization | LOW | VERY HIGH | P3 |
| Offline-First | MEDIUM | VERY HIGH | P3 |
| QR Code Scanning | LOW | LOW | P3 |
| BMS/IoT Integration | LOW | VERY HIGH | P3 |
| Historical Snapshots | LOW | HIGH | P3 |
| Collaborative Annotations | LOW | MEDIUM | P3 |
| Heat Maps | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (core value proposition)
- P2: Should have, add when possible (completes single-user experience, enables multi-user/team scale)
- P3: Nice to have, future consideration (advanced features, enterprise scale, specialized workflows)

## Competitor Feature Analysis

| Feature | FMX | AkitaBox | MaintainX | Our Approach |
|---------|-----|----------|-----------|--------------|
| Floor Plan Import | PDF/CAD import | PDF/CAD import with auto-detection | Image import | Start with simple PNG/JPG import, defer CAD complexity |
| Asset Markers | Pinned to floor plan | Location-based mapping | Work order locations | Click to place, drag to move, link to asset DB |
| Scale Calibration | Automatic from CAD | Automatic from CAD | Manual | Two-point manual calibration (simple, reliable) |
| Multi-Floor | Floor selector | 3D building view | Floor hierarchy | Start with floor selector, defer 3D until validated |
| Mobile Access | Native iOS/Android app | Web + native app | Native mobile-first app | PWA/responsive web to avoid app store overhead |
| Asset Import | CSV + API | CSV + Yardi/MRI integration | CSV + API | CSV import/export as universal adapter |
| Maintenance | Full CMMS workflow | Integrated work orders | Core feature (work order focused) | Defer CMMS until location tracking validated |
| Team Collaboration | Role-based permissions | Role-based + approval workflows | Real-time team updates | Start with basic roles, defer workflow complexity |
| Reporting | Custom dashboards | Standard + custom reports | Analytics dashboard | CSV export only, let users use Excel |
| Offline Support | Limited offline | Requires connectivity | Offline mobile app | Defer until field connectivity issues validated |

## Sources

### Asset Management Domain
- [The 10 Best Digital Asset Management Software Options in 2026](https://www.mediavalet.com/blog/best-digital-asset-management-platform)
- [The Complete Guide to Facilities Asset Management - FMX](https://www.gofmx.com/blog/facilities-asset-management/)
- [Facility Asset Management: Key Elements & Benefits Guide](https://redbeam.com/blog/facility-asset-management)
- [Facility Asset Management: Purpose, Benefits & Key Processes](https://limble.com/learn/asset-maintenance/facility/)
- [How to Improve Facility Asset Management and Maximize Equipment Lifespan | MaintainX](https://www.getmaintainx.com/blog/asset-tracking-facility-management)

### Floor Plan & Spatial Tools
- [Interactive Mapping and Facility Floor Plan Software - FMX](https://www.gofmx.com/features/interactive-mapping/)
- [MapPlug - Map-based Facility Management Software](https://www.mapplug.com/)
- [The Power of Interactive Floor Plans and Asset Mapping Software](https://apiko.com/blog/construction-management-interactive-floor-plans-asset-mapping-software/)
- [How to use the measurement and calibration tools – Fieldwire Knowledge Base](https://help.fieldwire.com/hc/en-us/articles/211449806-How-to-use-the-measurement-and-calibration-tools)
- [Facilities Hierarchy (Buildings, Floors, Spaces) | Asset Optics](https://assetoptics.com/aolex/facilities-hierarchy-buildings-floors-spaces/)

### Data Import/Export & Search
- [Shelf | How to Filter, Export and Report on Your Asset Inventory](https://www.shelf.nu/knowledge-base/how-to-filter-export-and-report-on-your-asset-inventory)
- [Cloud asset inventory - Microsoft Defender for Cloud](https://learn.microsoft.com/en-us/azure/defender-for-cloud/asset-inventory)

### Multi-User & Collaboration
- [Collaborative Asset Management for Teams: How to Leverage Digital Apps](https://myassets.com/blog/asset-management/collaborative-asset-management-for-teams-myassets/)
- [Assets (Digital Asset Management) - User and Group Management | Cloudinary](https://cloudinary.com/documentation/dam_admin_users_groups)
- [The Complete Guide to Digital Asset Management](https://www.pattern.com/topics/dam)

### NHS/Healthcare Requirements
- [NHS England: Guidance on managing medical equipment within virtual wards](https://www.england.nhs.uk/long-read/guidance-on-managing-medical-equipment-within-virtual-wards-including-hospital-at-home/)
- [Medical Equipment Management Policy - NHS Fife](https://www.nhsfife.org/about-us/policies-and-procedures/general-policies/medical-equipment-management-policy/)
- [Medical Equipment Lifecycle Management - NHS Golden Jubilee](https://www.nhsgoldenjubilee.co.uk/publications/policies/medical-equipment/medical-equipment-lifecycle-management)

### Competitor Analysis
- [5 Best Facility Management Software in 2025 | Accruent](https://www.accruent.com/resources/knowledge-hub/best-facility-management-software)
- [5 Best Facility Management Software in 2025 (In-Depth Review) | Coast](https://coastapp.com/blog/facility-management-software/)
- [Interactive Mapping and Facility Floor Plan Software - FMX](https://www.gofmx.com/features/interactive-mapping/)

---
*Feature research for: Visual Asset Management & Floor Plan Mapping*
*Researched: 2026-01-28*
