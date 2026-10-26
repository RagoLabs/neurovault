# NeuroVault — Personal Neurosurgery Clinical Management System

A frontend-only demonstration of a personal clinical management platform for **Dr. Max Gamma**, a neurosurgeon performing brain and spinal surgery. The application runs entirely in the browser with **fictional demonstration data**. There is no backend, no authentication server and no database.

> **Demo Mode — Fictional Clinical Data.** No real patients. Radiological images are openly licensed sample educational images (see `public/images/ATTRIBUTION.md`) and are never presented as a patient's own scan.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build     # type-check + production build (dist/)
npm run preview   # serve the production build
npm test          # vitest: dataset integrity, clinical calculations, repository workflows
npm run lint      # oxlint
```

## Technology

Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · React Router 8 · Radix UI (via `radix-ui`) with shadcn-style components · Motion · Recharts · TanStack Table 8 · React Hook Form + Zod 4 · date-fns · Sonner · Zustand (persisted to localStorage) · jsPDF + jspdf-autotable · SheetJS (xlsx) · cmdk.

## Project structure

```
src/
  app/            App, router (lazy routes), providers
  components/
    ui/           Radix-based primitives (button, dialog, select, table, …)
    layout/       AppShell, Sidebar, Topbar, GlobalSearch, NotificationCenter, WelcomeDialog, DemoTour
    shared/       DataTable, StatCard, StatusBadge, Timeline, PatientSelect, FormField, …
    charts/       ActivityChart, DonutChart, RecoveryChart, SimpleBarChart
    clinical/     GCS, pupils, motor power, brain/spine case panels, assessment summary
  pages/          One folder per module (dashboard, patients, consultations, surgeries, reports,
                  assessments, imaging, postoperative, followups, calendar, anatomy, analytics,
                  documents, hospitals, settings)
  mock/           patients.ts · clinical.ts · surgeries.ts · scheduling.ts · index.ts (+ integrity validator)
  services/       repository.ts (service layer), stats.ts, search.ts
  stores/         demoStore.ts (Zustand + localStorage persistence, reset)
  types/          Domain model
  utils/          clinical.ts (GCS, ODI, follow-up derivation), export.ts (PDF/CSV/XLSX), format.ts
  config/         surgeon.ts (identity & branding), demo.ts (fixed reference date), images.ts (image registry)
public/images/    Licensed sample imaging, illustrations, ATTRIBUTION.md
```

### Surgeon identity

All branding and the surgeon's professional identity live in `src/config/surgeon.ts`. Edit that file to re-brand the application.

### Demo reference date

The dataset is anchored to a fixed reference date (`src/config/demo.ts`, 2026-10-26) so that overdue, upcoming and "today" states stay coherent whenever the demo is opened. Set `useLiveClock` to `true` to use the real clock.

### Data layer

Components never import mock arrays. They use the service layer in `src/services/repository.ts` (`getPatients`, `createPatient`, `createSurgicalCase`, `createFollowup`, `getDashboardStats` via `services/stats.ts`, …) and the hooks it exposes. The functions read and update a single persisted Zustand store, so they can be replaced by real API calls later. Changes persist in `localStorage` under `neurovault.demo.v1`; **Settings → Demo data management → Reset demo data** restores the original dataset.

## Implemented modules

- **Dashboard** — greeting by local time, 8 statistic cards with trends, surgical activity chart (7d/30d/6m/12m, brain vs spine), procedure distribution donut, upcoming/overdue follow-ups, recent cases, quick actions.
- **Patients** — searchable, sortable, paginated directory with filters, table and grid views; validated multi-section registration form; profile with summary header and tabs (overview, clinical timeline, consultations, cases, assessments, imaging, follow-ups, documents).
- **Consultations** — list, create/edit with draft vs complete validation, reusable note templates, detail view with PDF export and "initiate surgical case".
- **Neurosurgical cases** — directory with type/status/hospital filters; five-step wizard (patient → type → clinical details with brain- or spine-specific fields → planning → review) with preserved state; case detail with brain/spine panels, GCS and grading, complications, status workflow, linked report, postoperative notes, assessments, follow-ups and imaging.
- **Operative reports** — editor with brain and spine templates, save draft, preview, print, in-browser PDF export, finalize (locks the report) and a tracked amendment workflow with version history.
- **Neurological assessments** — repeated assessments (GCS with not-testable components, pupils, motor power, sensory, reflexes, ODI calculator, mRS/KPS, manual ASIA grade) and a before/after comparison page with charts and a structured table that never treats missing data as change.
- **Postoperative care** — inpatient/discharge overview, chronological progress-note timeline with multiple notes per surgery, pain trend, discharge summary form with PDF export.
- **Follow-ups** — dashboard (today, upcoming, overdue, completed, missed, needs assessment), schedule/record form with next-appointment creation, attendance and outcome charts.
- **Surgical calendar** — month, week and agenda views with surgery, follow-up and consultation events and a detail drawer.
- **Imaging & investigations** — directory with filters, add-record dialog, preview modal with zoom/pan and navigation, sample-image labelling.
- **Anatomy explorer** — interactive SVG brain regions and spinal segments linking to procedures, conditions and related mock cases.
- **Analytics & reports** — filters (date range, hospital, type, procedure, diagnosis, outcome), activity and outcome charts with explicit statistic definitions, de-identified CSV/Excel/PDF exports, printable surgical logbook.
- **Documents** — categorised generated documents, search, preview, download, demo upload (browser-only) with stated limitations.
- **Hospitals** — directory with case counts and recent activity, add/edit dialog.
- **Settings** — profile, professional information, clinical preferences, brain/spine note templates, notifications, appearance (light/dark/system, density, reduced motion), demo data management (reset, validate, export JSON), demonstration-only security information.
- **Demo experience** — welcome dialog, guided tour, demo badge, global search (⌘K) across patients, cases, consultations and procedures.

## Demo journeys

1. **Amina Kessy (NV-0001)** — right frontal low-grade glioma: consultation → preoperative assessment → awake craniotomy (NSC-2026-001) → finalized operative report → postoperative notes and discharge → follow-ups → recovery comparison.
2. **Joseph Mwangi (NV-0002)** — L4/L5 microdiscectomy with pain and ODI improvement.
3. **Daniel Okafor (NV-0003)** — emergency decompressive craniectomy with GCS components not testable, wound infection, cranioplasty reoperation.
4. **Grace Lumumba (NV-0004)** — ACDF with a missed follow-up and an unknown outcome.
5. **Samuel Ndlovu (NV-0005)** — MCA aneurysm clipping with an overdue review.

## Known limitations

- Frontend prototype only: no authentication, authorisation, audit logging or server persistence. Security settings are explicitly demonstration-only.
- Demo uploads are kept in the browser; files over 200 KB are not persisted across reloads.
- No DICOM viewer; imaging attachments are labelled sample educational images.
- ISNCSCI/ASIA grades are entered manually (no automatic classification).
- Surgeon profile fields are configuration, not editable in the UI.
- Mock dataset volumes exceed the brief's suggested ranges for assessments, follow-ups and postoperative notes so that longitudinal charts have enough points.

## Licensing of imagery

See `public/images/ATTRIBUTION.md`. SVG illustrations, the anatomy explorer and the favicon are original work in this repository.
