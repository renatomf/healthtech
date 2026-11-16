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
    <div className="space-y-6 pt-4">
      <Link
        to="/paciente"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Meus exames
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
        <article className="space-y-6">
          <header className="rounded-3xl bg-linear-to-b from-hero-from to-hero-to p-6">
            <p className="text-sm text-muted">Laudo</p>
            <h1 className="mt-1 text-3xl font-light tracking-tight">{report.data.title}</h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Profissional responsável</dt>
                <dd className="font-medium">{report.data.professionalName}</dd>
              </div>
              <div>
                <dt className="text-muted">Publicado em</dt>
                <dd className="font-medium">{formatClinicDateTime(report.data.publishedAt)}</dd>
              </div>
            </dl>
          </header>
          <Card>
            {/* Texto puro: o React escapa o conteúdo; quebras de linha preservadas. */}
            <p className="leading-relaxed whitespace-pre-wrap">{report.data.body}</p>
          </Card>
        </article>
      )}
    </div>
  );
}
