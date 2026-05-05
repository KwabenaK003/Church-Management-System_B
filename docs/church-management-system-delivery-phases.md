# Church Management System Delivery Phases

## Purpose

This document breaks the rewritten product prompt into implementation phases for a production-grade Church Management System built with the Next.js App Router, Tailwind CSS, Supabase, Zustand, TanStack Query, React Hook Form, Zod, Resend, and Hubtel.

The goal is to build the application structure first, then deliver each module in dependency order without violating the architectural constraints.

## Product Constraints

- All pages are client-rendered with `"use client"`.
- No API routes. Data access goes directly through the Supabase JS client.
- No SSR.
- Logged-in users have full access to the admin application.
- Public access is allowed only for attendance check-in requirements.
- Use Phosphor Icons only.
- Use a clean blue-and-white theme with no gradients.
- Prefer modular, reusable, feature-oriented architecture.

## Recommended File And Folder Standards

- Use kebab-case for documentation filenames.
- Keep features grouped by domain under shared app, component, hook, service, and type boundaries.
- Standardize reusable UI for forms, tables, filters, empty states, upload flows, and charts before deep module work.

## Delivery Strategy

The work should be delivered in phases because the rewritten prompt is broader than the current repository and changes several architectural expectations. The highest-risk items are schema design, file storage, public attendance rules, CSV import validation, and secure SMS delivery.

## Phase 0: Architecture Alignment

### Goal

Align the current repository with the rewritten prompt before deeper feature work starts.

### Deliverables

- Confirm the application will remain fully client-rendered.
- Remove or refactor any patterns that assume API routes or SSR.
- Standardize route structure around the required admin menu:
  - Dashboard
  - Members
  - Visitors
  - Attendance
  - Finance
  - Bulk SMS
  - Equipment
  - Reports
  - Settings
  - Cluster Follow-up
- Define shared naming conventions for files, query keys, stores, hooks, and component props.
- Decide whether to adopt shadcn/ui fully or incrementally align the existing component layer to that standard.
- Define a reusable app shell, sidebar, page header, filter bar, form layout, modal pattern, and data table pattern.

### Why This Phase Comes First

Without a stable architectural baseline, every module will drift in style, state handling, validation patterns, and data access conventions.

## Phase 1: Supabase Data Model And Platform Foundation

### Goal

Design a fully normalized database and storage model that supports every feature in the prompt.

### Deliverables

- Redesign `supabase_schema.sql` to cover:
  - members
  - member profiles
  - membership status history
  - membership classes
  - transfer records
  - member attachments
  - visitors
  - visitor notes or follow-up events
  - clusters
  - services
  - service locations
  - attendance
  - donation categories
  - donations
  - donor statements or statement inputs
  - pledge campaigns
  - pledges
  - pledge payments
  - expense categories
  - budgets
  - expenses
  - follow-up tasks
  - SMS templates
  - SMS campaigns
  - SMS recipients and delivery logs
  - notification schedules and logs
  - church settings
- Redesign `supabase_storage.sql` for:
  - profile photos
  - member attachments
  - expense receipts
  - church logo
- Define Row Level Security policies:
  - authenticated users can read and write all admin tables
  - anonymous users can read `services` and limited member display data required for public attendance
  - anonymous users can insert into `attendance`
- Define typed models for the final schema.
- Seed reference values such as donation categories, expense categories, equipment conditions, and membership statuses.

### Dependencies

This phase blocks nearly every feature phase.

## Phase 2: Shared Application Structure

### Goal

Build the cross-cutting systems used by every module.

### Deliverables

- Finalize the app shell and navigation.
- Create shared page-level patterns for loading, error, and empty states.
- Standardize Zustand stores for local UI state.
- Standardize TanStack Query setup, query keys, invalidation patterns, and optimistic update boundaries.
- Create shared form helpers using React Hook Form and Zod.
- Create shared table, badge, modal, tabs, and filter components.
- Create shared file-upload helpers for Supabase Storage.
- Create shared CSV import helpers, parsers, preview mappers, and row-level validation utilities.
- Create shared PDF export abstraction if PDF reporting is kept in scope.
- Add global design tokens for the blue-and-white theme with no gradients.

### Exit Criteria

All feature teams can build pages with the same primitives instead of inventing new patterns module by module.

## Phase 3: Members Module

### Goal

Deliver the full member management foundation because it feeds attendance, follow-up, notifications, finance linking, and reporting.

### Deliverables

- Single-member create and edit form.
- Member profile page with:
  - personal details
  - contact information
  - emergency contacts
  - profile photo upload
  - document attachments
  - baptism date
  - cluster assignment
  - marital status
  - occupation
- Member list with search, filters, and status views.
- Membership lifecycle handling:
  - active
  - inactive
  - transferred
  - deceased
- New member onboarding flow.
- Membership class tracking.
- Status change history.
- Transfer management.
- Bulk CSV import workflow with:
  - downloadable CSV template
  - CSV parsing
  - preview table before confirmation
  - validation feedback per row
  - invalid row highlighting
  - final confirmed upload

### Dependencies

Requires final schema, storage, and shared form/table/upload utilities.

## Phase 4: Visitors Module

### Goal

Deliver structured visitor capture and follow-up transitions.

### Deliverables

- Visitor create flow with:
  - name
  - phone
  - email
  - how they heard about the church
  - notes
- Visitor list with search and follow-up status filters.
- Mark visitors as followed up.
- Notes per visitor.
- Optional visitor-to-member conversion flow or linked onboarding handoff.

### Dependencies

Requires member and notification foundations for stronger follow-up automation.

## Phase 5: Attendance Module

### Goal

Deliver both admin attendance management and the public check-in experience.

### Deliverables

- Admin attendance management:
  - create services
  - manage services
  - set date and time
  - set geolocation
  - set allowed radius in metres
  - view attendance records per service
  - attendance summary widgets
  - attendance charts
- Public check-in page at `/attendance/[serviceId]`:
  - anonymous access
  - fetch service details
  - request browser geolocation on load
  - compare current coordinates against stored service coordinates
  - block attendance when outside configured radius
  - show a clear location error message
  - show member name list when within range
  - submit attendance without QR scanning
- Limited anonymous read model for service details and member display names.
- Anonymous attendance insert policy with validation safeguards.

### Dependencies

Requires finalized RLS, services model, member display model, and geolocation utility layer.

## Phase 6: Finance Module

### Goal

Deliver operational finance management with reporting support.

### Deliverables

- Donations:
  - record donations
  - optionally link donation to member
  - assign donation category
  - support payment methods: cash, mobile money, bank transfer, cheque, online
  - generate donor statements
- Pledges:
  - create pledge campaigns
  - track pledged versus paid amounts per member
  - manage statuses: pending, partial, fulfilled, cancelled
  - due dates
  - reminder hooks
- Expenses:
  - record expenses against categories
  - approval workflow: pending, approved, rejected
  - receipt upload via Supabase Storage
  - budget versus actual tracking per category
- Financial reporting inputs for monthly and annual summaries.

### Dependencies

Requires normalized finance tables, storage buckets, shared upload helpers, and reporting utilities.

## Phase 7: Bulk SMS And Notification Systems

### Goal

Deliver communication tooling for SMS and email reminders.

### Deliverables

- Bulk SMS campaigns:
  - compose campaign
  - target all members
  - target all visitors
  - target a specific cluster
  - target a custom list
  - schedule future sends
  - persist delivery status
- SMS templates:
  - create templates
  - manage templates
  - insert templates into campaign composition flow
- Email notification system via Resend for:
  - birthday reminders
  - anniversary notifications
  - membership milestones
  - custom event reminders
  - follow-up notifications
- Delivery and notification logging.

### Technical Risk

The prompt forbids API routes, but Hubtel requires secure secret handling. This phase must explicitly choose a secure delivery path that still respects the architecture, such as a Supabase-native server-side mechanism if allowed by project rules.

### Dependencies

Requires members, visitors, clusters, settings, and delivery-log tables.

## Phase 8: Equipment Module

### Goal

Deliver operational equipment tracking.

### Deliverables

- Add and manage equipment records.
- Capture:
  - name
  - category
  - serial number
  - purchase date
  - purchase price
  - condition
  - location
  - assigned to
- Support condition values:
  - excellent
  - good
  - fair
  - poor
  - damaged
- Filtering and editing workflows.

### Dependencies

Low dependency outside the shared CRUD foundation.

## Phase 9: Reports Module

### Goal

Deliver reporting views and exports after the underlying modules are reliable.

### Deliverables

- Attendance trends chart for the last 8 services.
- Financial summary showing monthly income versus expenses.
- Member growth over time.
- Category-wise financial breakdowns.
- CSV export.
- PDF export.

### Dependencies

Requires stable attendance, members, and finance data models.

## Phase 10: Settings Module

### Goal

Deliver centralized system configuration for the administrators.

### Deliverables

- Church profile:
  - name
  - address
  - logo
- Manage donation categories.
- Manage expense categories.
- Manage clusters.
- Manage service locations with a geolocation picker.
- Resend email configuration.
- Hubtel SMS configuration.

### Dependencies

Some settings can be built earlier, but the final settings experience depends on the completed downstream modules.

## Phase 11: Cluster Follow-up Module

### Goal

Deliver structured follow-up task management for cluster leaders and administrators.

### Deliverables

- Assign follow-up tasks to cluster leaders for specific members.
- Track:
  - reason
  - assigned to
  - due date
  - status
  - notes
- Support statuses:
  - pending
  - in progress
  - completed
  - no response
- Filter by cluster.
- Filter by status.
- Link follow-up work to member history where useful.

### Dependencies

Requires members, clusters, and notification support.

## Phase 12: Hardening And Production Readiness

### Goal

Stabilize the entire system before production use.

### Deliverables

- Validate all RLS policies against real usage paths.
- Validate anonymous attendance rules carefully.
- Test storage uploads and file access policies.
- Review accessibility and keyboard navigation.
- Review loading, error, and empty states.
- Review form validation coverage.
- Review performance of list pages and reports.
- Review database indexes and query efficiency.
- Validate build output.
- Refresh documentation and environment setup notes.

## Suggested Execution Order Summary

1. Architecture alignment
2. Supabase schema and storage foundation
3. Shared application structure
4. Members
5. Visitors
6. Attendance
7. Finance
8. Bulk SMS and notifications
9. Equipment
10. Reports
11. Settings
12. Cluster follow-up
13. Hardening and production readiness

## Immediate Implementation Priorities

If implementation starts now, the first concrete tasks should be:

1. Finalize the normalized Supabase schema and storage design.
2. Standardize the shared application shell and reusable UI primitives.
3. Expand the shared TypeScript models to match the final schema.
4. Rebuild the Members module as the core dependency for most other modules.
5. Harden the public attendance flow around anonymous read and insert policies.

## Notes

- The current repository already covers parts of members, visitors, attendance, finance, equipment, SMS, reports, settings, and follow-up, but the rewritten prompt requires broader depth and tighter architecture consistency.
- PDF export, full Hubtel delivery, membership class tracking, transfer management, donor statements, and attachment-heavy member workflows should be treated as explicit implementation items, not assumed to already exist.
