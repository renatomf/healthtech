import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Modelo de dados — docs/ARQUITETURA.md §Modelo de dados.
 * Invariantes ficam aqui (CHECK / índices) E no domínio. O trigger de
 * imutabilidade do laudo publicado está na migration customizada.
 */

export const userRole = pgEnum('user_role', ['CLINIC', 'PATIENT']);
export const appointmentStatus = pgEnum('appointment_status', ['SCHEDULED', 'CANCELED']);
export const reportStatus = pgEnum('report_status', ['DRAFT', 'PUBLISHED']);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique('uq_users_email'),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull(),
    createdAt: createdAt(),
  },
  () => [check('chk_users_email_lowercase', sql`email = lower(email)`)],
);

export const examTypes = pgTable('exam_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique('uq_exam_types_code'),
  name: text('name').notNull(),
});

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => users.id),
    examTypeId: uuid('exam_type_id')
      .notNull()
      .references(() => examTypes.id),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: appointmentStatus('status').notNull().default('SCHEDULED'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    canceledBy: uuid('canceled_by').references(() => users.id),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
  },
  () => [
    // No máximo um agendamento ativo por horário; horário de cancelado é reutilizável (ADR-003).
    uniqueIndex('uq_active_slot').on(sql`scheduled_at`).where(sql`status = 'SCHEDULED'`),
    // Slots fixos de 30 min, sem segundos. Avaliado em UTC para não depender
    // do TimeZone da sessão (America/Sao_Paulo tem offset em horas inteiras).
    check(
      'chk_slot_aligned',
      sql`date_trunc('minute', scheduled_at AT TIME ZONE 'UTC') = scheduled_at AT TIME ZONE 'UTC'
        AND extract(minute FROM scheduled_at AT TIME ZONE 'UTC') IN (0, 30)`,
    ),
    // Cancelado se e somente se há quem cancelou e quando.
    check(
      'chk_canceled',
      sql`(status = 'CANCELED') = (canceled_at IS NOT NULL AND canceled_by IS NOT NULL)
        AND (canceled_at IS NULL) = (canceled_by IS NULL)`,
    ),
    index('idx_appt_patient').on(sql`patient_id`, sql`scheduled_at DESC`),
    index('idx_appt_scheduled_at').on(sql`scheduled_at`),
  ],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id)
      .unique('uq_report_appointment'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    professionalName: text('professional_name').notNull(),
    status: reportStatus('status').notNull().default('DRAFT'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedBy: uuid('published_by').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    // published_at (e quem publicou) presentes se e somente se publicado.
    check(
      'chk_published',
      sql`(status = 'PUBLISHED') = (published_at IS NOT NULL)
        AND (published_at IS NULL) = (published_by IS NULL)`,
    ),
    // SEGURANCA.md — API4: limite do texto do laudo também no banco.
    check('chk_report_body_length', sql`char_length(body) <= 20000`),
  ],
);
