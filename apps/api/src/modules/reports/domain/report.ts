export type AppointmentStatus = 'SCHEDULED' | 'CANCELED';
export type ReportStatus = 'DRAFT' | 'PUBLISHED';

export type ReportProblem =
  | 'APPOINTMENT_CANCELED'
  | 'REPORT_ALREADY_PUBLISHED'
  | 'REPORT_DRAFT_REQUIRED';

export function checkCanSaveDraft(
  appointment: AppointmentStatus,
  report: ReportStatus | null,
): ReportProblem | null {
  if (appointment === 'CANCELED') return 'APPOINTMENT_CANCELED';
  if (report === 'PUBLISHED') return 'REPORT_ALREADY_PUBLISHED';
  return null;
}

export function checkCanPublish(
  appointment: AppointmentStatus,
  report: ReportStatus | null,
): ReportProblem | null {
  if (appointment === 'CANCELED') return 'APPOINTMENT_CANCELED';
  if (report === 'PUBLISHED') return 'REPORT_ALREADY_PUBLISHED';
  if (report === null) return 'REPORT_DRAFT_REQUIRED';
  return null;
}
