-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Email threads policies
CREATE POLICY "Users can view own email threads" ON email_threads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email threads" ON email_threads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email threads" ON email_threads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own email threads" ON email_threads
  FOR DELETE USING (user_id = auth.uid());

-- Email insights policies
CREATE POLICY "Users can view own email insights" ON email_insights
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email insights" ON email_insights
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email insights" ON email_insights
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own email insights" ON email_insights
  FOR DELETE USING (user_id = auth.uid());

-- Daily digests policies
CREATE POLICY "Users can view own daily digests" ON daily_digests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily digests" ON daily_digests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily digests" ON daily_digests
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own daily digests" ON daily_digests
  FOR DELETE USING (user_id = auth.uid());
