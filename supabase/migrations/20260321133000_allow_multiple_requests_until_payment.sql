ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS unique_slot_booking;

DROP INDEX IF EXISTS unique_paid_slot_booking;

CREATE UNIQUE INDEX IF NOT EXISTS unique_paid_slot_booking
  ON bookings (time_slot_id)
  WHERE is_paid = TRUE
    AND status IN ('approved', 'completed');

DROP TRIGGER IF EXISTS trg_booking_mark_slot ON bookings;
DROP TRIGGER IF EXISTS trg_booking_free_slot ON bookings;
DROP TRIGGER IF EXISTS trg_booking_sync_slot_on_insert ON bookings;
DROP TRIGGER IF EXISTS trg_booking_sync_slot_on_update ON bookings;
DROP TRIGGER IF EXISTS trg_booking_sync_slot_on_delete ON bookings;

DROP FUNCTION IF EXISTS mark_slot_booked();
DROP FUNCTION IF EXISTS free_slot_on_cancel();
DROP FUNCTION IF EXISTS sync_time_slot_booking_state(UUID);
DROP FUNCTION IF EXISTS sync_booking_slot_state();

CREATE OR REPLACE FUNCTION sync_time_slot_booking_state(slot_uuid UUID)
RETURNS VOID AS $$
BEGIN
  IF slot_uuid IS NULL THEN
    RETURN;
  END IF;

  UPDATE time_slots
  SET is_booked = EXISTS (
    SELECT 1
    FROM bookings
    WHERE time_slot_id = slot_uuid
      AND is_paid = TRUE
      AND status IN ('approved', 'completed')
  )
  WHERE id = slot_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_booking_slot_state()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_time_slot_booking_state(OLD.time_slot_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.time_slot_id IS DISTINCT FROM NEW.time_slot_id THEN
    PERFORM sync_time_slot_booking_state(OLD.time_slot_id);
  END IF;

  PERFORM sync_time_slot_booking_state(NEW.time_slot_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_sync_slot_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_booking_slot_state();

CREATE TRIGGER trg_booking_sync_slot_on_update
  AFTER UPDATE OF status, is_paid, time_slot_id ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_booking_slot_state();

CREATE TRIGGER trg_booking_sync_slot_on_delete
  AFTER DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_booking_slot_state();

UPDATE time_slots AS ts
SET is_booked = EXISTS (
  SELECT 1
  FROM bookings AS b
  WHERE b.time_slot_id = ts.id
    AND b.is_paid = TRUE
    AND b.status IN ('approved', 'completed')
);
