import { TZDate } from '@date-fns/tz';
import { CLINIC_TIMEZONE, clinicDate, parseClinicSlot } from '@healthtech/shared';
import bcrypt from 'bcryptjs';
import { addDays, subHours } from 'date-fns';
import { createDb, type Db } from './client.ts';
import { appointments, examTypes, reports, users } from './schema.ts';

const DEMO_PASSWORD = 'Demo@1234';

// Insere direto no banco: a regra "não agendar no passado" vale só para a API.
export async function seed(db: Db, now = new Date()) {
  const at = (dayOffset: number, time: string) =>
    parseClinicSlot(clinicDate(addDays(new TZDate(now, CLINIC_TIMEZONE), dayOffset)), time);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [clinic, joao, maria] = await db
    .insert(users)
    .values([
      { name: 'Equipe da Clínica', email: 'clinica@demo.local', passwordHash, role: 'CLINIC' },
      { name: 'João da Silva', email: 'joao@demo.local', passwordHash, role: 'PATIENT' },
      { name: 'Maria Oliveira', email: 'maria@demo.local', passwordHash, role: 'PATIENT' },
    ])
    .returning();

  const [raioX, ultrassom, ressonancia] = await db
    .insert(examTypes)
    .values([
      { code: 'RAIO_X', name: 'Raio-X' },
      { code: 'ULTRASSOM', name: 'Ultrassom' },
      { code: 'RESSONANCIA', name: 'Ressonância magnética' },
    ])
    .returning();

  if (!clinic || !joao || !maria || !raioX || !ultrassom || !ressonancia) {
    throw new Error('seed: inserts incompletos');
  }

  const appt = (patientId: string, examTypeId: string, scheduledAt: Date) => ({
    patientId,
    examTypeId,
    scheduledAt,
    createdBy: clinic.id,
  });

  const [a, b, c] = await db
    .insert(appointments)
    .values([
      appt(joao.id, raioX.id, at(-1, '10:00')),
      appt(joao.id, ultrassom.id, at(-1, '14:00')),
      appt(maria.id, ressonancia.id, at(-1, '11:00')),
      {
        ...appt(maria.id, raioX.id, at(1, '09:00')),
        status: 'CANCELED' as const,
        canceledBy: clinic.id,
        canceledAt: subHours(now, 2),
      },
      appt(joao.id, ressonancia.id, at(1, '10:00')),
      appt(maria.id, ultrassom.id, at(2, '15:30')),
    ])
    .returning();

  if (!a || !b || !c) throw new Error('seed: inserts incompletos');

  const published = {
    status: 'PUBLISHED' as const,
    publishedAt: subHours(now, 1),
    publishedBy: clinic.id,
  };
  await db.insert(reports).values([
    {
      appointmentId: a.id,
      title: 'Raio-X de tórax',
      body: 'Campos pulmonares sem alterações. Área cardíaca dentro dos limites da normalidade.',
      professionalName: 'Dra. Ana Souza',
      createdBy: clinic.id,
      ...published,
    },
    {
      appointmentId: b.id,
      title: 'Ultrassom de abdome',
      body: 'RASCUNHO: fígado de dimensões normais. Aguardando revisão.',
      professionalName: 'Dr. Carlos Lima',
      createdBy: clinic.id,
    },
    {
      appointmentId: c.id,
      title: 'Ressonância magnética de joelho',
      body: 'Menisco medial íntegro. Pequeno derrame articular.',
      professionalName: 'Dra. Ana Souza',
      createdBy: clinic.id,
      ...published,
    },
  ]);
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida');
  const { db, sql, close } = createDb(url);
  // --if-empty: usado na subida do container; só semeia um banco novo, nunca apaga dados.
  const [row] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM users`;
  if (process.argv.includes('--if-empty') && (row?.count ?? 0) > 0) {
    process.stdout.write('seed: banco já tem dados, nada a fazer\n');
  } else {
    await sql`TRUNCATE reports, appointments, exam_types, users CASCADE`;
    await seed(db);
    process.stdout.write('seed: dados de demonstração carregados\n');
  }
  await close();
}
