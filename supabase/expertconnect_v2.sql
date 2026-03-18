 -- ============================================================
-- ExpertConnect (Team Kraken) — Supabase PostgreSQL Schema
-- v3: Fixed email duplication, RLS policies, admin access,
--     double-booking constraint, UTC timezone notes
-- ============================================================

-- ─────────────────────────────────────────────
-- ENUMS (Dropdown values)
-- ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('user', 'professional', 'admin');

-- ✅ Updated: undergraduate, school_student, job only
CREATE TYPE user_status AS ENUM ('undergraduate', 'school_student', 'job');

CREATE TYPE professional_status AS ENUM ('pending_approval', 'approved', 'rejected');

CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- ✅ Days of the week — used in time_slots for recurring weekly availability
CREATE TYPE day_of_week AS ENUM (
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
);

-- ✅ Asia timezones only (Sri Lanka = Asia/Colombo is first)
CREATE TYPE time_zone AS ENUM (
  'Asia/Colombo',       -- Sri Lanka       UTC+5:30
  'Asia/Kolkata',       -- India           UTC+5:30
  'Asia/Karachi',       -- Pakistan        UTC+5:00
  'Asia/Dhaka',         -- Bangladesh      UTC+6:00
  'Asia/Kathmandu',     -- Nepal           UTC+5:45
  'Asia/Dubai',         -- UAE             UTC+4:00
  'Asia/Riyadh',        -- Saudi Arabia    UTC+3:00
  'Asia/Baghdad',       -- Iraq            UTC+3:00
  'Asia/Tehran',        -- Iran            UTC+3:30
  'Asia/Kabul',         -- Afghanistan     UTC+4:30
  'Asia/Tbilisi',       -- Georgia         UTC+4:00
  'Asia/Yerevan',       -- Armenia         UTC+4:00
  'Asia/Tashkent',      -- Uzbekistan      UTC+5:00
  'Asia/Almaty',        -- Kazakhstan      UTC+6:00
  'Asia/Yangon',        -- Myanmar         UTC+6:30
  'Asia/Bangkok',       -- Thailand        UTC+7:00
  'Asia/Ho_Chi_Minh',   -- Vietnam         UTC+7:00
  'Asia/Jakarta',       -- Indonesia West  UTC+7:00
  'Asia/Kuala_Lumpur',  -- Malaysia        UTC+8:00
  'Asia/Singapore',     -- Singapore       UTC+8:00
  'Asia/Manila',        -- Philippines     UTC+8:00
  'Asia/Shanghai',      -- China           UTC+8:00
  'Asia/Taipei',        -- Taiwan          UTC+8:00
  'Asia/Hong_Kong',     -- Hong Kong       UTC+8:00
  'Asia/Seoul',         -- South Korea     UTC+9:00
  'Asia/Tokyo'          -- Japan           UTC+9:00
);

-- ✅ Includes 'Other' type — when selected, skill_other_label in professional_skills must be filled
CREATE TYPE skill_tag AS ENUM (
  'Web Development',
  'Mobile Development',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'Blockchain',
  'Project Management',
  'Digital Marketing',
  'Content Writing',
  'Finance',
  'Law',
  'Medicine',
  'Accounting',
  'Photography',
  'Video Editing',
  'Business Strategy',
  'Human Resources',
  'Other'               -- ✅ Free-text fallback skill
);


-- ─────────────────────────────────────────────
-- TABLE: verify_time_options
-- Dropdown for professional's preferred verification slot
-- Format: '<Weekday> <H:MM AM/PM>'  e.g. 'Monday 6:00 PM'
-- ─────────────────────────────────────────────

CREATE TABLE verify_time_options (
  id    SERIAL PRIMARY KEY,
  label TEXT   NOT NULL UNIQUE   -- e.g. 'Monday 6:00 PM'
);

-- Seed all day + time slot combinations
INSERT INTO verify_time_options (label) VALUES
  ('Monday 6:00 AM'),   ('Monday 9:00 AM'),   ('Monday 12:00 PM'),
  ('Monday 3:00 PM'),   ('Monday 6:00 PM'),   ('Monday 9:00 PM'),
  ('Tuesday 6:00 AM'),  ('Tuesday 9:00 AM'),  ('Tuesday 12:00 PM'),
  ('Tuesday 3:00 PM'),  ('Tuesday 6:00 PM'),  ('Tuesday 9:00 PM'),
  ('Wednesday 6:00 AM'),('Wednesday 9:00 AM'),('Wednesday 12:00 PM'),
  ('Wednesday 3:00 PM'),('Wednesday 6:00 PM'),('Wednesday 9:00 PM'),
  ('Thursday 6:00 AM'), ('Thursday 9:00 AM'), ('Thursday 12:00 PM'),
  ('Thursday 3:00 PM'), ('Thursday 6:00 PM'), ('Thursday 9:00 PM'),
  ('Friday 6:00 AM'),   ('Friday 9:00 AM'),   ('Friday 12:00 PM'),
  ('Friday 3:00 PM'),   ('Friday 6:00 PM'),   ('Friday 9:00 PM'),
  ('Saturday 9:00 AM'), ('Saturday 12:00 PM'),('Saturday 3:00 PM'),
  ('Saturday 6:00 PM'), ('Saturday 9:00 PM'),
  ('Sunday 9:00 AM'),   ('Sunday 12:00 PM'),  ('Sunday 3:00 PM'),
  ('Sunday 6:00 PM'),   ('Sunday 9:00 PM');


-- ─────────────────────────────────────────────
-- TABLE: profiles
-- Central auth-linked table (maps to Supabase Auth)
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role   NOT NULL DEFAULT 'user',
  name          TEXT        NOT NULL,
  -- ✅ FIX 1: email REMOVED — already stored in auth.users.email
  -- Storing it here caused mismatch if user updates email in Supabase Auth.
  -- Use the view `profiles_with_email` below to read email safely.
  profile_photo TEXT,                       -- Supabase Storage URL
  bio           TEXT,
  time_zone     time_zone   NOT NULL,       -- Asia timezone dropdown
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ Convenience view: join profiles with auth.users to expose email safely
-- Use this instead of profiles.email everywhere in your app
CREATE VIEW profiles_with_email
  WITH (security_invoker = false)
  AS
  SELECT
    p.*,
    u.email
  FROM profiles p
  JOIN auth.users u ON u.id = p.id;


-- ─────────────────────────────────────────────
-- TABLE: user_profiles
-- Extra info for users (role = 'user')
-- ─────────────────────────────────────────────

CREATE TABLE user_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status        user_status NOT NULL DEFAULT 'school_student',  -- dropdown: undergraduate / school_student / job
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- TABLE: professional_profiles
-- Extra info for professionals (role = 'professional')
-- ─────────────────────────────────────────────

CREATE TABLE professional_profiles (
  id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID                NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  national_id         TEXT,
  linkedin            TEXT,
  instagram           TEXT,
  facebook            TEXT,
  field               TEXT                NOT NULL,
  university          TEXT,
  degree              TEXT,
  job                 TEXT,
  job_title           TEXT,
  phone_number        TEXT,
  portfolio           TEXT,
  price_per_hour      NUMERIC(10, 2)      NOT NULL DEFAULT 0,
  status              professional_status NOT NULL DEFAULT 'pending_approval',
  verify_time_id      INTEGER             REFERENCES verify_time_options(id),  -- day+time dropdown FK
  created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- TABLE: professional_skills
-- Multi-select skills for professionals
-- 'Other' must have skill_other_label filled in
-- ─────────────────────────────────────────────

CREATE TABLE professional_skills (
  id                      UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID      NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  skill                   skill_tag NOT NULL,
  skill_other_label       TEXT,     -- Required when skill = 'Other'
  UNIQUE (professional_profile_id, skill),
  CHECK (
    skill <> 'Other'
    OR (skill = 'Other' AND skill_other_label IS NOT NULL AND skill_other_label <> '')
  )
);


-- ─────────────────────────────────────────────
-- TABLE: time_slots
-- Available weekly time slots set by a professional
--
-- ✅ CHANGED: Stores recurring weekly availability
-- instead of absolute timestamps.
-- Format: day_of_week + start_time (TIME) + end_time (TIME)
-- Example: Monday 6:00 PM — 7:00 PM
--
-- The professional's time_zone from profiles.time_zone
-- determines how these times are interpreted.
-- ─────────────────────────────────────────────

CREATE TABLE time_slots (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_profile_id UUID        NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  day_of_week             day_of_week NOT NULL,
  start_time              TIME        NOT NULL,
  end_time                TIME        NOT NULL,
  is_booked               BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  -- Prevent duplicate slots for the same professional on the same day/time
  UNIQUE (professional_profile_id, day_of_week, start_time, end_time)
);


-- ─────────────────────────────────────────────
-- TABLE: bookings
-- Session requests from users to professionals
-- ─────────────────────────────────────────────

CREATE TABLE bookings (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id         UUID           NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  professional_profile_id UUID           NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  time_slot_id            UUID           NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
  status                  booking_status NOT NULL DEFAULT 'pending',
  is_paid                 BOOLEAN        NOT NULL DEFAULT FALSE,
  payment_link            TEXT,          -- Emailed to user on approval
  zoom_link               TEXT,          -- Added after payment confirmed
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- ✅ FIX 4: Prevents two bookings from claiming the same time slot
  -- This is the DB-level guarantee — do not rely on app logic alone
  CONSTRAINT unique_slot_booking UNIQUE (time_slot_id)
);


-- ─────────────────────────────────────────────
-- TABLE: reviews
-- Ratings left by users after completed sessions
-- ─────────────────────────────────────────────

CREATE TABLE reviews (
  id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID    NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_profile_id         UUID    NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  professional_profile_id UUID    NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  rating                  INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- TABLE: email_logs
-- Track emails sent (approvals, rejections, payments)
-- ─────────────────────────────────────────────

CREATE TABLE email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient   TEXT        NOT NULL,
  subject     TEXT        NOT NULL,
  body        TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_id  UUID,        -- booking_id or professional_profile_id
  type        TEXT         -- 'booking_approved','booking_rejected','pro_approved','pro_rejected','payment'
);


-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX idx_profiles_role                ON profiles(role);
CREATE INDEX idx_professional_status          ON professional_profiles(status);
CREATE INDEX idx_bookings_user                ON bookings(user_profile_id);
CREATE INDEX idx_bookings_professional        ON bookings(professional_profile_id);
CREATE INDEX idx_bookings_status              ON bookings(status);
CREATE INDEX idx_time_slots_professional      ON time_slots(professional_profile_id);
CREATE INDEX idx_time_slots_available         ON time_slots(professional_profile_id, is_booked);
CREATE INDEX idx_reviews_professional         ON reviews(professional_profile_id);
CREATE INDEX idx_prof_skills_professional     ON professional_skills(professional_profile_id);


-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_skills   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Public can read profiles of approved professionals (for browse page)
CREATE POLICY "Public read professional profiles"
  ON profiles FOR SELECT
  USING (
    role = 'professional' AND id IN (
      SELECT profile_id FROM professional_profiles WHERE status = 'approved'
    )
  );

-- ✅ FIX 2: Simplified — profile_id IS the auth uid, no subquery needed
CREATE POLICY "Professionals manage own professional profile"
  ON professional_profiles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Public read approved professionals"
  ON professional_profiles FOR SELECT
  USING (status = 'approved');

-- Public can read skills of approved professionals (for browse page)
CREATE POLICY "Public read professional skills"
  ON professional_skills FOR SELECT
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE status = 'approved'
    )
  );

-- Professionals manage their own skills
CREATE POLICY "Professionals manage own skills"
  ON professional_skills FOR ALL
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE profile_id = auth.uid()
    )
  );

-- Public can read reviews of approved professionals (for browse page)
CREATE POLICY "Public read professional reviews"
  ON reviews FOR SELECT
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE status = 'approved'
    )
  );

-- ✅ FIX 2 applied: simplified user booking policy too
CREATE POLICY "Users manage own bookings"
  ON bookings FOR ALL
  USING (user_profile_id IN (SELECT id FROM user_profiles WHERE profile_id = auth.uid()));

-- ✅ FIX 2 applied: simplified professional booking policy
CREATE POLICY "Professionals see own bookings"
  ON bookings FOR SELECT
  USING (professional_profile_id IN (SELECT id FROM professional_profiles WHERE profile_id = auth.uid()));

-- ✅ FIX 3: Admin full-access policies — without these, admin dashboard BREAKS
-- Helper: reusable function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admins full access to professional_profiles"
  ON professional_profiles FOR ALL
  USING (is_admin());

CREATE POLICY "Admins full access to bookings"
  ON bookings FOR ALL
  USING (is_admin());

CREATE POLICY "Admins full access to reviews"
  ON reviews FOR ALL
  USING (is_admin());

CREATE POLICY "Admins full access to time_slots"
  ON time_slots FOR ALL
  USING (is_admin());

CREATE POLICY "Users manage own user_profile"
  ON user_profiles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Admins full access to user_profiles"
  ON user_profiles FOR ALL
  USING (is_admin());


-- ─────────────────────────────────────────────
-- TRIGGERS & FUNCTIONS
-- ─────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_professional_profiles_updated_at
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Mark slot as booked when booking is created
CREATE OR REPLACE FUNCTION mark_slot_booked()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE time_slots SET is_booked = TRUE WHERE id = NEW.time_slot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_mark_slot
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION mark_slot_booked();

-- Free slot if booking is cancelled or rejected
CREATE OR REPLACE FUNCTION free_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' OR NEW.status = 'rejected' THEN
    UPDATE time_slots SET is_booked = FALSE WHERE id = NEW.time_slot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_free_slot
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION free_slot_on_cancel();
