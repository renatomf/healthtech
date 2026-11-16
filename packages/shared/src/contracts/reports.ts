import { z } from 'zod';
import { appointmentStatus, reportStatus } from './scheduling.ts';

export const saveReportRequest = z.strictObject({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20_000),
  professionalName: z.string().trim().min(1).max(200),
});
export type SaveReportRequest = z.infer<typeof saveReportRequest>;

/** Laudo como a clínica vê: inclui rascunho e situação. */
export const clinicReportResponse = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  professionalName: z.string(),
  status: reportStatus,
  publishedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});
export type ClinicReportResponse = z.infer<typeof clinicReportResponse>;

/** Agendamento como o paciente vê: sem nenhum campo de conteúdo de laudo. */
export const patientAppointmentResponse = z.object({
  id: z.uuid(),
  scheduledAt: z.iso.datetime(),
  status: appointmentStatus,
  examType: z.object({ name: z.string() }),
  hasPublishedReport: z.boolean(),
});
export type PatientAppointmentResponse = z.infer<typeof patientAppointmentResponse>;

/** Laudo como o paciente vê: só publicado. */
export const patientReportResponse = z.object({
  title: z.string(),
  body: z.string(),
  professionalName: z.string(),
  publishedAt: z.iso.datetime(),
});
export type PatientReportResponse = z.infer<typeof patientReportResponse>;
