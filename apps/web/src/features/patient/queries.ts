import type { PatientAppointmentResponse, PatientReportResponse } from '@healthtech/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.ts';

export function useMyAppointments() {
  return useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => api<PatientAppointmentResponse[]>('/patient/appointments'),
  });
}

export function useMyReport(appointmentId: string) {
  return useQuery({
    queryKey: ['my-report', appointmentId],
    queryFn: () => api<PatientReportResponse>(`/patient/appointments/${appointmentId}/report`),
  });
}
