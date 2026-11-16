import {
  appointmentResponse,
  clinicDayRange,
  createAppointmentRequest,
  examTypeResponse,
  idParams,
  listAppointmentsQuery,
  slotResponse,
  slotsQuery,
} from '@healthtech/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { notFound } from '../../../shared/errors.ts';
import {
  cancelAppointment,
  createAppointment,
  listSlots,
  type SchedulingDeps,
} from '../application/appointments.ts';
import {
  type AppointmentView,
  findAppointment,
  listAppointments,
  listExamTypes,
} from '../infra/appointment-repository.ts';

const toDto = (a: AppointmentView) => ({ ...a, scheduledAt: a.scheduledAt.toISOString() });

function found(a: AppointmentView | undefined) {
  if (!a) throw notFound();
  return toDto(a);
}

export function schedulingRoutes(deps: SchedulingDeps): FastifyPluginAsyncZod {
  const { db, hours } = deps;

  return async (app) => {
    app.get('/exam-types', { schema: { response: { 200: z.array(examTypeResponse) } } }, () =>
      listExamTypes(db),
    );

    app.get(
      '/slots',
      { schema: { querystring: slotsQuery, response: { 200: z.array(slotResponse) } } },
      (request) => listSlots(deps, request.query.date),
    );

    app.get(
      '/appointments',
      {
        schema: {
          querystring: listAppointmentsQuery,
          response: { 200: z.array(appointmentResponse) },
        },
      },
      async (request) => {
        const { date, patientId } = request.query;
        const range = date ? clinicDayRange(date, hours.timeZone) : undefined;
        const rows = await listAppointments(db, { range, patientId });
        return rows.map(toDto);
      },
    );

    app.get(
      '/appointments/:id',
      { schema: { params: idParams, response: { 200: appointmentResponse } } },
      async (request) => found(await findAppointment(db, request.params.id)),
    );

    app.post(
      '/appointments',
      { schema: { body: createAppointmentRequest, response: { 201: appointmentResponse } } },
      async (request, reply) => {
        const { scheduledAt, ...rest } = request.body;
        const created = await createAppointment(
          deps,
          { ...rest, scheduledAt: new Date(scheduledAt) },
          request.user.id,
        );
        return reply.status(201).send(found(created));
      },
    );

    app.post(
      '/appointments/:id/cancel',
      { schema: { params: idParams, response: { 200: appointmentResponse } } },
      async (request) => found(await cancelAppointment(deps, request.params.id, request.user.id)),
    );
  };
}
