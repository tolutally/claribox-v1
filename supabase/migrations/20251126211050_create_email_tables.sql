-- Create email_threads table
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gmail_thread_id VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  last_message_date TIMESTAMP WITH TIME ZONE NOT NULL,
  message_count INTEGER DEFAULT 1,
  labels TEXT[] DEFAULT '{}',
  is_unread BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_insights table
CREATE TABLE email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  priority_score DECIMAL(3,2) NOT NULL CHECK (priority_score >= 0 AND priority_score <= 1),
  summary TEXT NOT NULL,
  key_points TEXT[] NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_digests table
CREATE TABLE daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  total_emails INTEGER DEFAULT 0,
  high_priority_count INTEGER DEFAULT 0,
  follow_ups_due INTEGER DEFAULT 0,
  summary TEXT NOT NULL,
  key_insights JSONB DEFAULT '[]',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE TRIGGER update_email_threads_updated_at 
    BEFORE UPDATE ON email_threads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_insights_updated_at 
    BEFORE UPDATE ON email_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_digests_updated_at 
    BEFORE UPDATE ON daily_digests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX idx_email_threads_gmail_thread_id ON email_threads(gmail_thread_id);
CREATE INDEX idx_email_threads_last_message_date ON email_threads(last_message_date);
CREATE INDEX idx_email_threads_is_unread ON email_threads(is_unread);

CREATE INDEX idx_email_insights_user_id ON email_insights(user_id);
CREATE INDEX idx_email_insights_thread_id ON email_insights(thread_id);
CREATE INDEX idx_email_insights_priority_score ON email_insights(priority_score);
CREATE INDEX idx_email_insights_follow_up_required ON email_insights(follow_up_required);

CREATE INDEX idx_daily_digests_user_id ON daily_digests(user_id);
CREATE INDEX idx_daily_digests_digest_date ON daily_digests(digest_date);

-- Create unique constraints
CREATE UNIQUE INDEX idx_email_threads_user_gmail_unique ON email_threads(user_id, gmail_thread_id);
CREATE UNIQUE INDEX idx_daily_digests_user_date_unique ON daily_digests(user_id, digest_date);
