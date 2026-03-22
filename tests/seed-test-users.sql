-- ============================================================
-- ExpertConnect Test User Seed Script
-- ============================================================
-- Run this against your test database to create the test users
-- needed for E2E testing.
--
-- IMPORTANT: Run this AFTER your test database is set up with
-- the main schema (expertconnect_v2.sql)
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- NOTE: Supabase Auth users must be created via the Auth API
-- or Supabase Dashboard. This script only creates the profile
-- records that link to those auth users.
--
-- Step 1: Create users in Supabase Dashboard (Authentication > Users)
--   - test@example.com        (password: TestPassword123!)
--   - testpro@example.com     (password: TestPassword123!)
--   - testadmin@example.com   (password: TestPassword123!)
--
-- Step 2: Copy the UUID for each user from the dashboard
--
-- Step 3: Replace the UUIDs below with the actual UUIDs
-- ═══════════════════════════════════════════════════════════

-- Replace these with actual UUIDs from your Supabase Auth users
-- You can find them in: Supabase Dashboard > Authentication > Users

DO $$
DECLARE
  -- ⚠️ REPLACE THESE UUIDS with your actual test user UUIDs from Supabase Auth
  v_user_id UUID := '4ed2bdbf-a53e-40ca-97b1-d40d978b9a8b';  -- test@example.com
  v_pro_id UUID := '85f966b9-ed3a-4d25-bc25-2ee6c67b3cef';   -- testpro@example.com
  v_admin_id UUID := 'e7f4ba64-5013-4e64-8919-19635faee675'; -- testadmin@example.com
  v_pro_profile_id UUID;
BEGIN
  -- ─────────────────────────────────────────────
  -- 1. Regular User (role = 'user')
  -- ─────────────────────────────────────────────
  INSERT INTO profiles (id, role, name, time_zone, bio)
  VALUES (
    v_user_id,
    'user',
    'Test User',
    'Asia/Colombo',
    'I am a test user for E2E testing.'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  INSERT INTO user_profiles (profile_id, status)
  VALUES (v_user_id, 'undergraduate')
  ON CONFLICT (profile_id) DO NOTHING;

  RAISE NOTICE 'Created test user: test@example.com';

  -- ─────────────────────────────────────────────
  -- 2. Professional (role = 'professional')
  -- ─────────────────────────────────────────────
  INSERT INTO profiles (id, role, name, time_zone, bio)
  VALUES (
    v_pro_id,
    'professional',
    'Test Professional',
    'Asia/Colombo',
    'I am a test professional for E2E testing. Expert in Web Development.'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  INSERT INTO professional_profiles (
    profile_id,
    field,
    university,
    degree,
    job,
    job_title,
    price_per_hour,
    status
  )
  VALUES (
    v_pro_id,
    'Software Engineering',
    'University of Colombo',
    'BSc in Computer Science',
    'TechCorp',
    'Senior Developer',
    25.00,
    'approved'  -- Important: approved so they can receive bookings
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    status = 'approved',
    price_per_hour = 25.00
  RETURNING id INTO v_pro_profile_id;

  -- Add skills for the professional
  INSERT INTO professional_skills (professional_profile_id, skill)
  VALUES
    (v_pro_profile_id, 'Web Development'),
    (v_pro_profile_id, 'Mobile Development')
  ON CONFLICT (professional_profile_id, skill) DO NOTHING;

  -- Add some available time slots
  INSERT INTO time_slots (professional_profile_id, day_of_week, start_time, end_time)
  VALUES
    (v_pro_profile_id, 'Monday', '09:00', '10:00'),
    (v_pro_profile_id, 'Monday', '10:00', '11:00'),
    (v_pro_profile_id, 'Wednesday', '14:00', '15:00'),
    (v_pro_profile_id, 'Friday', '16:00', '17:00')
  ON CONFLICT (professional_profile_id, day_of_week, start_time, end_time) DO NOTHING;

  RAISE NOTICE 'Created test professional: testpro@example.com';

  -- ─────────────────────────────────────────────
  -- 3. Admin (role = 'admin')
  -- ─────────────────────────────────────────────
  INSERT INTO profiles (id, role, name, time_zone, bio)
  VALUES (
    v_admin_id,
    'admin',
    'Test Admin',
    'Asia/Colombo',
    'I am a test admin for E2E testing.'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  RAISE NOTICE 'Created test admin: testadmin@example.com';

  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Credentials:';
  RAISE NOTICE '  User:         test@example.com      / TestPassword123!';
  RAISE NOTICE '  Professional: testpro@example.com   / TestPassword123!';
  RAISE NOTICE '  Admin:        testadmin@example.com / TestPassword123!';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
