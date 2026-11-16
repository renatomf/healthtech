import type { AppointmentResponse } from '@healthtech/shared';
import { Badge } from '../../components/ui/badge.tsx';

export function AppointmentBadges({ appointment }: { appointment: AppointmentResponse }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {appointment.status === 'CANCELED' ? (
        <Badge tone="danger">Cancelado</Badge>
      ) : (
        <Badge tone="info">Agendado</Badge>
      )}
      {appointment.reportStatus === 'DRAFT' && <Badge tone="warning">Laudo em rascunho</Badge>}
      {appointment.reportStatus === 'PUBLISHED' && <Badge tone="success">Laudo publicado</Badge>}
    </span>
  );
}
