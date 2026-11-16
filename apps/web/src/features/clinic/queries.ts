import type {
  AppointmentResponse,
  ClinicReportResponse,
  CreateAppointmentRequest,
  ExamTypeResponse,
  PatientResponse,
  SaveReportRequest,
  SlotResponse,
} from '@healthtech/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, queryString } from '../../lib/api.ts';

export function useAppointments(filters: { date?: string; patientId?: string }) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => api<AppointmentResponse[]>(`/clinic/appointments${queryString(filters)}`),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api<AppointmentResponse>(`/clinic/appointments/${id}`),
  });
}

export function useReport(appointmentId: string) {
  return useQuery({
    queryKey: ['report', appointmentId],
    queryFn: async () => {
      try {
        return await api<ClinicReportResponse>(`/clinic/appointments/${appointmentId}/report`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });
}

export function usePatients(search: string) {
  return useQuery({
    queryKey: ['patients', search],
    queryFn: () => api<PatientResponse[]>(`/clinic/patients${queryString({ search })}`),
  });
}

export function useExamTypes() {
  return useQuery({
    queryKey: ['exam-types'],
    queryFn: () => api<ExamTypeResponse[]>('/clinic/exam-types'),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSlots(date: string) {
  return useQuery({
    queryKey: ['slots', date],
    queryFn: () => api<SlotResponse[]>(`/clinic/slots?date=${date}`),
    enabled: Boolean(date),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAppointmentRequest) =>
      api<AppointmentResponse>('/clinic/appointments', { method: 'POST', body }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

/** Cancelar, salvar e publicar mudam agendamento e laudo: recarrega os dois. */
function useAppointmentMutation<T>(id: string, request: (body: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export const useCancelAppointment = (id: string) =>
  useAppointmentMutation<void>(id, () =>
    api(`/clinic/appointments/${id}/cancel`, { method: 'POST' }),
  );

export const useSaveReport = (id: string) =>
  useAppointmentMutation<SaveReportRequest>(id, (body) =>
    api(`/clinic/appointments/${id}/report`, { method: 'PUT', body }),
  );

export const usePublishReport = (id: string) =>
  useAppointmentMutation<void>(id, () =>
    api(`/clinic/appointments/${id}/report/publish`, { method: 'POST' }),
  );
