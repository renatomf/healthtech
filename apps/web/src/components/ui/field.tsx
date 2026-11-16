import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from 'react';
import { cn } from '../../lib/cn.ts';

const control =
  'w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted ' +
  'disabled:bg-surface-muted disabled:text-muted aria-invalid:border-danger';

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
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
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
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, 'min-h-48 py-3 leading-relaxed', className)} {...props} />
  );
}
