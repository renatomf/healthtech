import { ChevronDown } from 'lucide-react';
import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from 'react';
import { cn } from '../../lib/cn.ts';

const control =
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
      <label htmlFor={id} className="block text-[13px] text-muted">
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

/** Seta própria (a nativa fica colada na borda direita). */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-12 appearance-none pr-12', className)} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, 'min-h-56 py-4 leading-relaxed', className)} {...props} />
  );
}
