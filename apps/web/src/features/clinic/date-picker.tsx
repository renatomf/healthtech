import { formatClinicDateTime, parseClinicSlot } from '@healthtech/shared';
import { CalendarDays } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { control } from '../../components/ui/field.tsx';
import { cn } from '../../lib/cn.ts';
import { MiniCalendar } from './mini-calendar.tsx';

interface Props {
  /** id vindo do <Field>; o rótulo dele tem id `${id}-label`. */
  id: string;
  value: string; // YYYY-MM-DD no fuso da clínica
  today: string;
  min?: string;
  onChange: (date: string) => void;
  'aria-describedby'?: string;
}

/**
 * Seletor de data no visual do projeto (o calendário do <input type="date"> é do navegador).
 * Abre o mesmo calendário da agenda num painel; Esc ou clique fora fecham; ao abrir, o foco
 * vai para o dia selecionado e, ao fechar, volta para o campo.
 */
export function DatePicker({ id, value, today, min, onChange, ...aria }: Props) {
  const panelId = useId();
  const valueId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    // Foco no dia selecionado; se não estiver no mês exibido, no primeiro dia disponível.
    const days = panel.current?.querySelectorAll<HTMLButtonElement>('[aria-pressed]') ?? [];
    const target =
      [...days].find((d) => d.getAttribute('aria-pressed') === 'true') ??
      [...days].find((d) => !d.disabled);
    target?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${id}-label ${valueId}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(control, 'flex h-12 items-center justify-between gap-3 text-left')}
        {...aria}
      >
        <span id={valueId} className="block truncate first-letter:uppercase">
          {formatClinicDateTime(parseClinicSlot(value, '12:00'), 'EEEE, dd/MM/yyyy')}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      </button>
      <div
        ref={panel}
        id={panelId}
        role="dialog"
        aria-label="Escolher dia"
        hidden={!open}
        onKeyDown={onKeyDown}
        className="absolute right-0 z-20 mt-2 w-full min-w-72 rounded-2xl bg-surface p-4 shadow-[0_16px_40px_rgb(11_22_56/0.14)] ring-1 ring-border sm:w-80"
      >
        <MiniCalendar
          key={value.slice(0, 7)}
          value={value}
          today={today}
          min={min}
          onChange={(date) => {
            onChange(date);
            close();
          }}
        />
      </div>
    </div>
  );
}
