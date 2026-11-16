import { useEffect, useId, useRef } from 'react';
import { Button } from './button.tsx';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// <dialog> nativo: foco preso no diálogo, Esc fecha e o resto da página fica inerte.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  pending,
  onConfirm,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-4xl bg-surface p-8 text-foreground backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <h2 id={titleId} className="text-2xl font-light tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-sm text-muted">{description}</p>
      <div className="mt-8 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Voltar
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
