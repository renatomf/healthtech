CREATE TYPE "public"."appointment_status" AS ENUM('SCHEDULED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CLINIC', 'PATIENT');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"exam_type_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canceled_by" uuid,
	"canceled_at" timestamp with time zone,
	CONSTRAINT "chk_slot_aligned" CHECK (date_trunc('minute', scheduled_at AT TIME ZONE 'UTC') = scheduled_at AT TIME ZONE 'UTC'
        AND extract(minute FROM scheduled_at AT TIME ZONE 'UTC') IN (0, 30)),
	CONSTRAINT "chk_canceled" CHECK ((status = 'CANCELED') = (canceled_at IS NOT NULL AND canceled_by IS NOT NULL)
        AND (canceled_at IS NULL) = (canceled_by IS NULL))
);
--> statement-breakpoint
CREATE TABLE "exam_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "uq_exam_types_code" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"professional_name" text NOT NULL,
	"status" "report_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_report_appointment" UNIQUE("appointment_id"),
	CONSTRAINT "chk_published" CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL)
        AND (published_at IS NULL) = (published_by IS NULL)),
	CONSTRAINT "chk_report_body_length" CHECK (char_length(body) <= 20000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_users_email" UNIQUE("email"),
	CONSTRAINT "chk_users_email_lowercase" CHECK (email = lower(email))
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_canceled_by_users_id_fk" FOREIGN KEY ("canceled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_slot" ON "appointments" USING btree (scheduled_at) WHERE status = 'SCHEDULED';--> statement-breakpoint
CREATE INDEX "idx_appt_patient" ON "appointments" USING btree (patient_id,scheduled_at DESC);--> statement-breakpoint
CREATE INDEX "idx_appt_scheduled_at" ON "appointments" USING btree (scheduled_at);