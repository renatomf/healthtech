import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

export const CLINIC_TIMEZONE = 'America/Sao_Paulo';

/** Dia (YYYY-MM-DD) do instante no fuso da clínica. */
export function clinicDate(instant: Date, timeZone = CLINIC_TIMEZONE): string {
  return format(new TZDate(instant, timeZone), 'yyyy-MM-dd');
}

/** Instante de um horário (HH:MM) de um dia (YYYY-MM-DD) no fuso da clínica. */
export function parseClinicSlot(date: string, time: string, timeZone = CLINIC_TIMEZONE): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  return new Date(new TZDate(year, month - 1, day, hour, minute, timeZone).getTime());
}
