-- Seed data for development/testing
-- Note: This should only be run in development environments

-- Insert a test family
INSERT INTO families (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Family')
ON CONFLICT DO NOTHING;

-- Note: Test users should be created via Supabase Auth
-- The handle_new_user() trigger will create their profiles

SELECT 'Seed data loaded' AS status;
