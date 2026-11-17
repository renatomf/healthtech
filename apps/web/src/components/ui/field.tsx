import { Check, ChevronDown } from 'lucide-react';
import {
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/cn.ts';

/** Visual dos campos, também usado por controles próprios (select, date picker). */
export const control =
  'w-full rounded-2xl bg-surface-muted px-4 text-sm text-foreground placeholder:text-muted ' +
  'ring-1 ring-transparent transition focus:bg-surface focus:ring-ring ' +
  'disabled:text-muted aria-invalid:ring-danger';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-[13px] text-muted">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {(error || hint) && (
        <p id={describedBy} className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-12', className)} {...props} />;
}

/** Próxima opção ativa para teclas de navegação; null se a tecla não navega. */
function nextIndex(key: string, active: number, last: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return Math.min(active + 1, last);
    case 'ArrowUp':
      return Math.max(active - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Select no visual do tema (o <select> nativo abre uma lista do sistema, com o azul padrão).
 * Padrão WAI-ARIA "select-only combobox": o foco fica no botão e a opção ativa é
 * anunciada por aria-activedescendant. Teclado: setas, Home/End, Enter/Espaço, Esc, letras.
 */
export function Select({ id, value, options, onChange, ...aria }: SelectProps) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [active, setActive] = useState(selectedIndex);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const target = nextIndex(e.key, active, options.length - 1);
    if (target !== null) {
      e.preventDefault();
      if (open) setActive(target);
      else show();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) choose(active);
      else show();
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key.length === 1) {
      const match = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (match >= 0) {
        if (open) setActive(match);
        else onChange(options[match]?.value ?? value);
      }
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cn(control, 'flex h-12 items-center justify-between gap-3 text-left')}
        {...aria}
      >
        <span className={cn('truncate', !selected && 'text-muted')}>
          {selected?.label ?? 'Selecione'}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted transition', open && 'rotate-180')}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      <div
        id={listId}
        role="listbox"
        hidden={!open}
        className="scroll-thin absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-[0_16px_40px_rgb(11_22_56/0.14)] ring-1 ring-border"
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <div
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={isSelected}
              onMouseEnter={() => setActive(index)}
              // mousedown + preventDefault: escolhe sem tirar o foco do botão.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(index);
              }}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm',
                index === active && 'bg-surface-muted',
                isSelected && 'text-link',
              )}
            >
              {option.label}
              {isSelected && <Check className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, 'min-h-56 py-4 leading-relaxed', className)} {...props} />
  );
}
