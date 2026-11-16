import { clinicTime, SLOT_MINUTES } from '@healthtech/shared';

export type AppointmentStatus = 'SCHEDULED' | 'CANCELED';
export type ReportStatus = 'DRAFT' | 'PUBLISHED';

export interface BusinessHours {
  open: string;
  close: string;
  timeZone: string;
}

export type SlotProblem = 'SLOT_NOT_ALIGNED' | 'SLOT_IN_PAST' | 'SLOT_OUTSIDE_BUSINESS_HOURS';

export function checkSlot(slot: Date, now: Date, hours: BusinessHours): SlotProblem | null {
  const aligned =
    slot.getUTCMinutes() % SLOT_MINUTES === 0 &&
    slot.getUTCSeconds() === 0 &&
    slot.getUTCMilliseconds() === 0;
  if (!aligned) return 'SLOT_NOT_ALIGNED';
  // Slot que já começou também conta como passado (INTERPRETACOES.md #1).
  if (slot <= now) return 'SLOT_IN_PAST';
  const time = clinicTime(slot, hours.timeZone);
  if (time < hours.open || time >= hours.close) return 'SLOT_OUTSIDE_BUSINESS_HOURS';
  return null;
}

export type CancelProblem = 'APPOINTMENT_ALREADY_CANCELED' | 'APPOINTMENT_HAS_PUBLISHED_REPORT';

export function checkCancel(
  status: AppointmentStatus,
  reportStatus: ReportStatus | null,
): CancelProblem | null {
  if (status === 'CANCELED') return 'APPOINTMENT_ALREADY_CANCELED';
  if (reportStatus === 'PUBLISHED') return 'APPOINTMENT_HAS_PUBLISHED_REPORT';
  return null;
}
