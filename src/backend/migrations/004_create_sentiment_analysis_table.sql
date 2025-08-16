-- Create sentiment_analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text_input TEXT NOT NULL,
    sentiment_score DECIMAL(3,2) NOT NULL, -- -1.0 to 1.0
    magnitude DECIMAL(3,2), -- 0.0 to 1.0
    emotions JSONB NOT NULL DEFAULT '{}', -- {joy: 0.8, sadness: 0.2, anger: 0.1, fear: 0.3, surprise: 0.1}
    dominant_emotion VARCHAR(50),
    keywords JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    therapeutic_indicators JSONB DEFAULT '{}',
    crisis_indicators JSONB DEFAULT '{}',
    risk_level VARCHAR(50) DEFAULT 'low', -- low, medium, high, critical
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_sentiment_message_id ON sentiment_analysis(message_id);
CREATE INDEX idx_sentiment_conversation_id ON sentiment_analysis(conversation_id);
CREATE INDEX idx_sentiment_user_id ON sentiment_analysis(user_id);
CREATE INDEX idx_sentiment_risk_level ON sentiment_analysis(risk_level);
CREATE INDEX idx_sentiment_created_at ON sentiment_analysis(created_at DESC);
CREATE INDEX idx_sentiment_dominant_emotion ON sentiment_analysis(dominant_emotion);