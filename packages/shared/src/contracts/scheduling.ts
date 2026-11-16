import { z } from 'zod';

export const appointmentStatus = z.enum(['SCHEDULED', 'CANCELED']);
export const reportStatus = z.enum(['DRAFT', 'PUBLISHED']);

export const idParams = z.strictObject({ id: z.uuid() });

export const createAppointmentRequest = z.strictObject({
  patientId: z.uuid(),
  examTypeId: z.uuid(),
  scheduledAt: z.iso.datetime({ offset: true }),
});
export type CreateAppointmentRequest = z.infer<typeof createAppointmentRequest>;

export const listAppointmentsQuery = z.strictObject({
  date: z.iso.date().optional(),
  patientId: z.uuid().optional(),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuery>;

export const appointmentResponse = z.object({
  id: z.uuid(),
  scheduledAt: z.iso.datetime(),
  status: appointmentStatus,
  patient: z.object({ id: z.uuid(), name: z.string() }),
  examType: z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
  reportStatus: reportStatus.nullable(),
});
export type AppointmentResponse = z.infer<typeof appointmentResponse>;

export const slotsQuery = z.strictObject({ date: z.iso.date() });

export const slotResponse = z.object({ startsAt: z.iso.datetime(), available: z.boolean() });
export type SlotResponse = z.infer<typeof slotResponse>;

export const examTypeResponse = z.object({ id: z.uuid(), code: z.string(), name: z.string() });
export type ExamTypeResponse = z.infer<typeof examTypeResponse>;

export const patientSearchQuery = z.strictObject({
  search: z.string().trim().max(100).optional(),
});

export const patientResponse = z.object({ id: z.uuid(), name: z.string(), email: z.string() });
export type PatientResponse = z.infer<typeof patientResponse>;
