-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database if not exists (run as superuser)
-- CREATE DATABASE therapeutic_db;

-- Switch to the therapeutic_db database
-- \c therapeutic_db;

-- Execute all migrations in order
\i /app/migrations/001_create_users_table.sql
\i /app/migrations/002_create_conversations_table.sql
\i /app/migrations/003_create_messages_table.sql
\i /app/migrations/004_create_sentiment_analysis_table.sql
\i /app/migrations/005_create_sessions_table.sql

-- Insert default therapeutic techniques
INSERT INTO therapeutic_techniques (name, category, description, prompts, effectiveness_score) VALUES
('Active Listening', 'CBT', 'Demonstrates understanding and empathy through reflective responses', 
 '["Can you tell me more about that?", "How did that make you feel?", "What I hear you saying is..."]'::jsonb, 0.85),
('Cognitive Reframing', 'CBT', 'Helps identify and challenge negative thought patterns',
 '["Is there another way to look at this situation?", "What evidence supports or contradicts this thought?", "How would you advise a friend in this situation?"]'::jsonb, 0.82),
('Mindfulness', 'Mindfulness', 'Encourages present-moment awareness and acceptance',
 '["Let''s take a moment to focus on your breathing", "What are you noticing in your body right now?", "Can you describe what you''re experiencing without judgment?"]'::jsonb, 0.78),
('Emotional Validation', 'DBT', 'Acknowledges and accepts emotional experiences',
 '["Your feelings are completely valid", "It makes sense that you would feel this way", "Anyone in your situation might feel similarly"]'::jsonb, 0.88),
('Problem Solving', 'CBT', 'Systematic approach to addressing challenges',
 '["What are some possible solutions?", "What has worked for you in the past?", "What would be the first small step?"]'::jsonb, 0.75),
('Grounding Techniques', 'DBT', 'Helps manage overwhelming emotions or anxiety',
 '["Name 5 things you can see right now", "Focus on the sensation of your feet on the ground", "Describe your surroundings in detail"]'::jsonb, 0.80)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_user_created ON sentiment_analysis(user_id, created_at);

-- Create a function to automatically update conversation status based on inactivity
CREATE OR REPLACE FUNCTION auto_complete_inactive_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET status = 'completed',
      ended_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO therapeutic_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO therapeutic_user;