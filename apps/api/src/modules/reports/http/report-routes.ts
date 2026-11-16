import {
  clinicReportResponse,
  idParams,
  patientAppointmentResponse,
  patientReportResponse,
  saveReportRequest,
} from '@healthtech/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { notFound } from '../../../shared/errors.ts';
import { publishReport, type ReportsDeps, saveDraft } from '../application/reports.ts';
import {
  findPublishedReportForPatient,
  findReport,
  listPatientAppointments,
} from '../infra/report-repository.ts';

type Report = NonNullable<Awaited<ReturnType<typeof findReport>>>;

function toClinicDto(report: Report | undefined) {
  if (!report) throw notFound();
  return {
    ...report,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function clinicReportRoutes(deps: ReportsDeps): FastifyPluginAsyncZod {
  return async (app) => {
    const schema = { params: idParams, response: { 200: clinicReportResponse } };

    app.get('/appointments/:id/report', { schema }, async (request) =>
      toClinicDto(await findReport(deps.db, request.params.id)),
    );

    app.put(
      '/appointments/:id/report',
      { schema: { ...schema, body: saveReportRequest } },
      async (request) =>
        toClinicDto(await saveDraft(deps, request.params.id, request.body, request.user.id)),
    );

    app.post('/appointments/:id/report/publish', { schema }, async (request) =>
      toClinicDto(await publishReport(deps, request.params.id, request.user.id)),
    );
  };
}

// patientId vem sempre do token (request.user), nunca da requisição.
export function patientRoutes(deps: ReportsDeps): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/appointments',
      { schema: { response: { 200: z.array(patientAppointmentResponse) } } },
      async (request) => {
        const rows = await listPatientAppointments(deps.db, request.user.id);
        return rows.map((a) => ({ ...a, scheduledAt: a.scheduledAt.toISOString() }));
      },
    );

    app.get(
      '/appointments/:id/report',
      { schema: { params: idParams, response: { 200: patientReportResponse } } },
      async (request) => {
        const report = await findPublishedReportForPatient(
          deps.db,
          request.params.id,
          request.user.id,
        );
        if (!report?.publishedAt) throw notFound();
        return { ...report, publishedAt: report.publishedAt.toISOString() };
      },
    );
  };
}
