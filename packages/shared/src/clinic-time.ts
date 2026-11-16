import { TZDate } from '@date-fns/tz';
import { addMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CLINIC_TIMEZONE = 'America/Sao_Paulo';
export const SLOT_MINUTES = 30;

/** Dia (YYYY-MM-DD) do instante no fuso da clínica. */
export function clinicDate(instant: Date, timeZone = CLINIC_TIMEZONE): string {
  return format(new TZDate(instant, timeZone), 'yyyy-MM-dd');
}

/** Hora (HH:MM) do instante no fuso da clínica. */
export function clinicTime(instant: Date, timeZone = CLINIC_TIMEZONE): string {
  return format(new TZDate(instant, timeZone), 'HH:mm');
}

/** Instante de um horário (HH:MM) de um dia (YYYY-MM-DD) no fuso da clínica. */
export function parseClinicSlot(date: string, time: string, timeZone = CLINIC_TIMEZONE): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  return new Date(new TZDate(year, month - 1, day, hour, minute, timeZone).getTime());
}

/** Intervalo [início, fim) do dia no fuso da clínica. */
export function clinicDayRange(date: string, timeZone = CLINIC_TIMEZONE) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  return {
    start: parseClinicSlot(date, '00:00', timeZone),
    end: parseClinicSlot(nextDay, '00:00', timeZone),
  };
}

/** Inícios dos slots do dia, de `open` até o último que termina em `close`. */
export function listClinicSlots(
  date: string,
  open: string,
  close: string,
  timeZone = CLINIC_TIMEZONE,
): Date[] {
  const end = parseClinicSlot(date, close, timeZone);
  const slots: Date[] = [];
  for (let slot = parseClinicSlot(date, open, timeZone); slot < end; ) {
    slots.push(slot);
    slot = addMinutes(slot, SLOT_MINUTES);
  }
  return slots;
}

/** Exibição de data/hora sempre no fuso da clínica, em português. */
export function formatClinicDateTime(
  instant: Date | string,
  pattern = "dd/MM/yyyy 'às' HH:mm",
  timeZone = CLINIC_TIMEZONE,
): string {
  return format(new TZDate(new Date(instant), timeZone), pattern, { locale: ptBR });
}
