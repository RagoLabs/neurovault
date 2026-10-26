import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { RouteError } from '@/pages/RouteError'

function page(loader: () => Promise<Record<string, unknown>>, name: string) {
  const C = lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })))
  return (
    <Suspense fallback={<PageSkeleton />}>
      <C />
    </Suspense>
  )
}

export const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(() => import('@/pages/dashboard/DashboardPage'), 'DashboardPage') },
      { path: 'patients', element: page(() => import('@/pages/patients/PatientsPage'), 'PatientsPage') },
      { path: 'patients/new', element: page(() => import('@/pages/patients/PatientFormPage'), 'PatientFormPage') },
      { path: 'patients/:id', element: page(() => import('@/pages/patients/PatientDetailPage'), 'PatientDetailPage') },
      { path: 'patients/:id/edit', element: page(() => import('@/pages/patients/PatientFormPage'), 'PatientFormPage') },
      { path: 'consultations', element: page(() => import('@/pages/consultations/ConsultationsPage'), 'ConsultationsPage') },
      { path: 'consultations/new', element: page(() => import('@/pages/consultations/ConsultationFormPage'), 'ConsultationFormPage') },
      { path: 'consultations/:id', element: page(() => import('@/pages/consultations/ConsultationDetailPage'), 'ConsultationDetailPage') },
      { path: 'consultations/:id/edit', element: page(() => import('@/pages/consultations/ConsultationFormPage'), 'ConsultationFormPage') },
      { path: 'cases', element: page(() => import('@/pages/surgeries/CasesPage'), 'CasesPage') },
      { path: 'cases/new', element: page(() => import('@/pages/surgeries/CaseWizardPage'), 'CaseWizardPage') },
      { path: 'cases/:id', element: page(() => import('@/pages/surgeries/CaseDetailPage'), 'CaseDetailPage') },
      { path: 'operative-reports', element: page(() => import('@/pages/reports/OperativeReportsPage'), 'OperativeReportsPage') },
      { path: 'operative-reports/new', element: page(() => import('@/pages/reports/OperativeReportEditorPage'), 'OperativeReportEditorPage') },
      { path: 'operative-reports/:id', element: page(() => import('@/pages/reports/OperativeReportEditorPage'), 'OperativeReportEditorPage') },
      { path: 'assessments', element: page(() => import('@/pages/assessments/AssessmentsPage'), 'AssessmentsPage') },
      { path: 'assessments/new', element: page(() => import('@/pages/assessments/AssessmentFormPage'), 'AssessmentFormPage') },
      { path: 'assessments/compare', element: page(() => import('@/pages/assessments/ComparePage'), 'ComparePage') },
      { path: 'assessments/:id', element: page(() => import('@/pages/assessments/AssessmentDetailPage'), 'AssessmentDetailPage') },
      { path: 'imaging', element: page(() => import('@/pages/imaging/ImagingPage'), 'ImagingPage') },
      { path: 'postoperative', element: page(() => import('@/pages/postoperative/PostoperativePage'), 'PostoperativePage') },
      { path: 'postoperative/:caseId', element: page(() => import('@/pages/postoperative/PostopCasePage'), 'PostopCasePage') },
      { path: 'follow-ups', element: page(() => import('@/pages/followups/FollowUpsPage'), 'FollowUpsPage') },
      { path: 'follow-ups/new', element: page(() => import('@/pages/followups/FollowUpFormPage'), 'FollowUpFormPage') },
      { path: 'follow-ups/:id', element: page(() => import('@/pages/followups/FollowUpFormPage'), 'FollowUpFormPage') },
      { path: 'calendar', element: page(() => import('@/pages/calendar/CalendarPage'), 'CalendarPage') },
      { path: 'anatomy', element: page(() => import('@/pages/anatomy/AnatomyPage'), 'AnatomyPage') },
      { path: 'analytics', element: page(() => import('@/pages/analytics/AnalyticsPage'), 'AnalyticsPage') },
      { path: 'analytics/logbook', element: page(() => import('@/pages/analytics/LogbookPage'), 'LogbookPage') },
      { path: 'documents', element: page(() => import('@/pages/documents/DocumentsPage'), 'DocumentsPage') },
      { path: 'hospitals', element: page(() => import('@/pages/hospitals/HospitalsPage'), 'HospitalsPage') },
      { path: 'settings', element: page(() => import('@/pages/settings/SettingsPage'), 'SettingsPage') },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: '*', element: page(() => import('@/pages/NotFound'), 'NotFound') },
    ],
  },
],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
