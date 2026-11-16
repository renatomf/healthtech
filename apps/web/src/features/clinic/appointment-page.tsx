import {
  type ClinicReportResponse,
  formatClinicDateTime,
  saveReportRequest,
} from '@healthtech/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import type { z } from 'zod';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { ConfirmDialog } from '../../components/ui/confirm-dialog.tsx';
import { Field, Input, Textarea } from '../../components/ui/field.tsx';
import { ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { errorMessage } from '../../lib/messages.ts';
import {
  useAppointment,
  useCancelAppointment,
  usePublishReport,
  useReport,
  useSaveReport,
} from './queries.ts';
import { AppointmentBadges } from './status.tsx';

export function AppointmentPage() {
  const { id = '' } = useParams();
  const appointment = useAppointment(id);
  const report = useReport(id);
  const cancel = useCancelAppointment(id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (appointment.isPending || report.isPending) return <Loading />;
  if (appointment.isError) return <ErrorMessage>{errorMessage(appointment.error)}</ErrorMessage>;
  if (report.isError) return <ErrorMessage>{errorMessage(report.error)}</ErrorMessage>;

  const a = appointment.data;
  const canceled = a.status === 'CANCELED';
  const published = a.reportStatus === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/clinica?data=${formatClinicDateTime(a.scheduledAt, 'yyyy-MM-dd')}`}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Agenda
      </Link>

      <Card className="bg-linear-to-b from-hero-from to-hero-to">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted">{a.examType.name}</p>
            <h1 className="text-3xl font-light tracking-tight">{a.patient.name}</h1>
            <p className="first-letter:uppercase">
              {formatClinicDateTime(a.scheduledAt, "EEEE, d 'de' MMMM 'às' HH:mm")}
              <span className="text-sm text-muted"> · horário de Brasília</span>
            </p>
          </div>
          <AppointmentBadges appointment={a} />
        </div>
        {!canceled && (
          <div className="mt-6 space-y-3">
            <Button
              variant="danger"
              size="sm"
              disabled={published}
              onClick={() => setConfirmCancel(true)}
            >
              Cancelar agendamento
            </Button>
            {published && (
              <p className="text-xs text-muted">
                Agendamentos com laudo publicado não podem ser cancelados.
              </p>
            )}
            {cancel.isError && <ErrorMessage>{errorMessage(cancel.error)}</ErrorMessage>}
          </div>
        )}
      </Card>

      {canceled ? (
        <Card>
          <p className="text-sm text-muted">Agendamento cancelado: não pode receber laudo.</p>
        </Card>
      ) : (
        <ReportEditor appointmentId={id} report={report.data} />
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar este agendamento?"
        description="O horário fica livre para outro paciente. Esta ação não pode ser desfeita."
        confirmLabel="Cancelar agendamento"
        tone="danger"
        pending={cancel.isPending}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirmCancel(false) })}
      />
    </div>
  );
}

type Form = z.input<typeof saveReportRequest>;

function ReportEditor({
  appointmentId,
  report,
}: {
  appointmentId: string;
  report: ClinicReportResponse | null;
}) {
  const save = useSaveReport(appointmentId);
  const publish = usePublishReport(appointmentId);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const published = report?.status === 'PUBLISHED';

  const form = useForm<Form, unknown, z.output<typeof saveReportRequest>>({
    resolver: zodResolver(saveReportRequest),
    values: report
      ? { title: report.title, body: report.body, professionalName: report.professionalName }
      : { title: '', body: '', professionalName: '' },
  });
  const { errors, isDirty } = form.formState;
  const error = save.error ?? publish.error;

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Laudo</h2>
        {report?.status === 'DRAFT' && (
          <Badge tone="warning">Rascunho · visível só para a clínica</Badge>
        )}
        {published && report.publishedAt && (
          <Badge tone="success">Publicado em {formatClinicDateTime(report.publishedAt)}</Badge>
        )}
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="space-y-4"
      >
        <fieldset disabled={published} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" error={errors.title && 'Informe o título.'}>
              {(p) => <Input {...p} {...form.register('title')} />}
            </Field>
            <Field
              label="Profissional responsável"
              error={errors.professionalName && 'Informe o profissional.'}
            >
              {(p) => <Input {...p} {...form.register('professionalName')} />}
            </Field>
          </div>
          <Field
            label="Texto do laudo"
            error={errors.body && 'Informe o texto (até 20.000 caracteres).'}
          >
            {(p) => <Textarea {...p} {...form.register('body')} />}
          </Field>
        </fieldset>

        {error && <ErrorMessage>{errorMessage(error)}</ErrorMessage>}

        {!published && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" variant="soft" disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : 'Salvar rascunho'}
            </Button>
            <Button
              disabled={!report || isDirty || publish.isPending}
              onClick={() => setConfirmPublish(true)}
              title={isDirty ? 'Salve as alterações antes de publicar' : undefined}
            >
              Publicar laudo
            </Button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmPublish}
        title="Publicar o laudo?"
        description="O paciente passa a ver o laudo, e ele não poderá mais ser editado."
        confirmLabel="Publicar"
        pending={publish.isPending}
        onClose={() => setConfirmPublish(false)}
        onConfirm={() => publish.mutate(undefined, { onSettled: () => setConfirmPublish(false) })}
      />
    </Card>
  );
}
