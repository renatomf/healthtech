import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn.ts';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const ymd = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

interface Props {
  value: string; // YYYY-MM-DD no fuso da clínica
  today: string;
  /** Dias antes desta data ficam desabilitados (ex.: não agendar no passado). */
  min?: string;
  onChange: (date: string) => void;
}

// Datas de calendário puras (sem horário): a aritmética em UTC não depende do fuso do navegador.
export function MiniCalendar({ value, today, min, onChange }: Props) {
  const [year, month] = value.split('-').map(Number) as [number, number];
  const [view, setView] = useState({ year, month: month - 1 });

  const first = new Date(Date.UTC(view.year, view.month, 1));
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const atMinMonth = min !== undefined && ymd(view.year, view.month, 1) <= `${min.slice(0, 7)}-01`;
  const move = (delta: number) => {
    const d = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-lg font-light tracking-tight capitalize">
          {MONTHS[view.month]} {view.year}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={atMinMonth}
            aria-label="Mês anterior"
            className="grid size-9 place-items-center rounded-full bg-surface-muted text-muted transition hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Próximo mês"
            className="grid size-9 place-items-center rounded-full bg-surface-muted text-muted transition hover:text-foreground"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-2 text-xs text-muted">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const date = ymd(view.year, view.month, day);
          const selected = date === value;
          const disabled = min !== undefined && date < min;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={`${day} de ${MONTHS[view.month]}`}
              style={day === 1 ? { gridColumnStart: first.getUTCDay() + 1 } : undefined}
              className={cn(
                'mx-auto grid size-9 place-items-center rounded-full transition',
                selected ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-muted',
                !selected && date === today && 'text-link ring-1 ring-ring',
                'disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
