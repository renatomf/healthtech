import { patientResponse, patientSearchQuery } from '@healthtech/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Db } from '../../../db/client.ts';
import { searchPatients } from '../infra/user-repository.ts';

export function patientSearchRoutes(db: Db): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/patients',
      { schema: { querystring: patientSearchQuery, response: { 200: z.array(patientResponse) } } },
      (request) => searchPatients(db, request.query.search),
    );
  };
}
