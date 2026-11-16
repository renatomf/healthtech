-- Laudo publicado é imutável, mesmo via SQL direto (ARQUITETURA.md, ADR-004).
-- Bloqueia UPDATE e DELETE de linha cujo estado ANTERIOR é PUBLISHED.
-- A publicação em si (DRAFT -> PUBLISHED) passa, pois OLD.status = 'DRAFT'.
CREATE FUNCTION forbid_published_report_change() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'published report is immutable'
      USING ERRCODE = 'P0001', CONSTRAINT = 'trg_report_immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_report_immutable BEFORE UPDATE OR DELETE ON reports
  FOR EACH ROW EXECUTE FUNCTION forbid_published_report_change();
