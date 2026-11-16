CREATE FUNCTION forbid_published_report_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'published report is immutable' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_report_immutable BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION forbid_published_report_update();
