-- Enable Row Level Security for all tables
-- This prevents direct access from Supabase client (frontend)
-- Only backend with service role key can access

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topic_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audio ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role (backend) to access everything
-- But block direct client access

-- Users table
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Questions table
CREATE POLICY "Service role full access" ON questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Exam sets table
CREATE POLICY "Service role full access" ON exam_sets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Question assignments table
CREATE POLICY "Service role full access" ON question_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Topics table
CREATE POLICY "Service role full access" ON topics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Question topic assignments table
CREATE POLICY "Service role full access" ON question_topic_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Practice sessions table
CREATE POLICY "Service role full access" ON practice_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User responses table
CREATE POLICY "Service role full access" ON user_responses
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription plans table
CREATE POLICY "Service role full access" ON subscription_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscriptions table
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payments table
CREATE POLICY "Service role full access" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Public shares table
CREATE POLICY "Service role full access" ON public_shares
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Reactions table
CREATE POLICY "Service role full access" ON reactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- App settings table
CREATE POLICY "Service role full access" ON app_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Maintenance schedules table
CREATE POLICY "Service role full access" ON maintenance_schedules
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Part instructions table
CREATE POLICY "Service role full access" ON part_instructions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- System audio table
CREATE POLICY "Service role full access" ON system_audio
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
