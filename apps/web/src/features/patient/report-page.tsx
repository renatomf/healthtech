import { formatClinicDateTime } from '@healthtech/shared';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Card } from '../../components/ui/card.tsx';
import { ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { ApiError } from '../../lib/api.ts';
import { errorMessage } from '../../lib/messages.ts';
import { useMyReport } from './queries.ts';

export function ReportPage() {
  const { id = '' } = useParams();
  const report = useMyReport(id);

  return (
    <div className="space-y-8">
      <Link
        to="/paciente"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden /> Meus exames
      </Link>

      {report.isPending && <Loading />}
      {report.isError &&
        (report.error instanceof ApiError && report.error.status === 404 ? (
          <Card>
            <p className="text-muted">Laudo não disponível.</p>
          </Card>
        ) : (
          <ErrorMessage>{errorMessage(report.error)}</ErrorMessage>
        ))}

      {report.isSuccess && (
        <article className="space-y-3">
          <Card tone="hero" className="space-y-10">
            <p className="text-sm">Laudo</p>
            <h1 className="text-4xl leading-tight font-light tracking-tight sm:text-5xl">
              {report.data.title}
            </h1>
          </Card>
          <dl className="grid grid-cols-2 gap-3">
            <div className="space-y-1 rounded-4xl bg-surface-muted p-6 sm:p-8">
              <dt className="text-[13px] text-muted">Profissional responsável</dt>
              <dd className="text-lg font-light tracking-tight">{report.data.professionalName}</dd>
            </div>
            <div className="space-y-1 rounded-4xl bg-surface-muted p-6 sm:p-8">
              <dt className="text-[13px] text-muted">Publicado em</dt>
              <dd className="text-lg font-light tracking-tight">
                {formatClinicDateTime(report.data.publishedAt)}
              </dd>
            </div>
          </dl>
          <Card>
            {/* Texto puro: o React escapa o conteúdo; quebras de linha preservadas. */}
            <p className="leading-relaxed whitespace-pre-wrap">{report.data.body}</p>
          </Card>
        </article>
      )}
    </div>
  );
}
