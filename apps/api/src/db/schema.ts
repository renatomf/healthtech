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

export const userRole = pgEnum('user_role', ['CLINIC', 'PATIENT']);
export const appointmentStatus = pgEnum('appointment_status', ['SCHEDULED', 'CANCELED']);
export const reportStatus = pgEnum('report_status', ['DRAFT', 'PUBLISHED']);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique('uq_users_email'),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull(),
  createdAt: createdAt(),
});

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
    uniqueIndex('uq_active_slot').on(sql`scheduled_at`).where(sql`status = 'SCHEDULED'`),
    // Em UTC para não depender do TimeZone da sessão do Postgres.
    check(
      'chk_slot_aligned',
      sql`date_trunc('minute', scheduled_at AT TIME ZONE 'UTC') = scheduled_at AT TIME ZONE 'UTC'
        AND extract(minute FROM scheduled_at AT TIME ZONE 'UTC') IN (0, 30)`,
    ),
    index('idx_appt_patient').on(sql`patient_id`, sql`scheduled_at DESC`),
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
  () => [check('chk_published', sql`(status = 'PUBLISHED') = (published_at IS NOT NULL)`)],
);
