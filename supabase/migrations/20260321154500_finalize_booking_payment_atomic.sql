DROP FUNCTION IF EXISTS finalize_booking_payment(UUID, UUID);

CREATE OR REPLACE FUNCTION finalize_booking_payment(
  p_booking_id UUID,
  p_user_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_slot RECORD;
BEGIN
  SELECT
    id,
    user_profile_id,
    professional_profile_id,
    time_slot_id,
    status,
    is_paid
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF v_booking.user_profile_id <> p_user_profile_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_booking.status <> 'approved' THEN
    RAISE EXCEPTION 'ONLY_APPROVED_BOOKINGS_CAN_BE_PAID';
  END IF;

  SELECT id, is_booked
  INTO v_slot
  FROM time_slots
  WHERE id = v_booking.time_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TIME_SLOT_NOT_FOUND';
  END IF;

  IF v_booking.is_paid THEN
    UPDATE time_slots
    SET is_booked = TRUE
    WHERE id = v_booking.time_slot_id;

    RETURN jsonb_build_object(
      'booking_id', v_booking.id,
      'time_slot_id', v_booking.time_slot_id,
      'professional_profile_id', v_booking.professional_profile_id,
      'already_paid', TRUE
    );
  END IF;

  IF v_slot.is_booked OR EXISTS (
    SELECT 1
    FROM bookings
    WHERE time_slot_id = v_booking.time_slot_id
      AND id <> v_booking.id
      AND is_paid = TRUE
      AND status IN ('approved', 'completed')
  ) THEN
    RAISE EXCEPTION 'TIME_SLOT_ALREADY_BOOKED';
  END IF;

  UPDATE bookings
  SET is_paid = TRUE
  WHERE id = v_booking.id;

  UPDATE time_slots
  SET is_booked = TRUE
  WHERE id = v_booking.time_slot_id;

  RETURN jsonb_build_object(
    'booking_id', v_booking.id,
    'time_slot_id', v_booking.time_slot_id,
    'professional_profile_id', v_booking.professional_profile_id,
    'already_paid', FALSE
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'TIME_SLOT_ALREADY_BOOKED';
END;
$$;
