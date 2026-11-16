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
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-3xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Voltar
        </Button>
        <Button variant={tone} onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
