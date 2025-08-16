# System Architecture - AI Therapeutic Conversation System

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Port 3443)                                │
│  • Voice Recording Component                               │
│  • Chat Interface                                          │
│  • Sentiment Visualization                                 │
│  • User Profile & Settings                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js API Server                                     │
│  • Authentication Middleware                               │
│  • Rate Limiting                                           │
│  • Request Validation                                      │
│  • WebSocket Handling                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Processing Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Sentiment       │  │ Conversation    │  │ Therapeutic  │ │
│  │ Analysis        │  │ Manager         │  │ Technique    │ │
│  │ Engine          │  │                 │  │ Engine       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Integration Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ OpenAI GPT-4    │  │ Whisper STT     │  │ ElevenLabs   │ │
│  │ Conversation    │  │ Voice Processing│  │ TTS          │ │
│  │ Engine          │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  • User Profiles                                           │
│  • Conversation History                                    │
│  • Sentiment Analysis Results                              │
│  • Therapeutic Session Data                                │
│  • User Preferences & Settings                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Sentiment Analysis Engine
- **Real-time processing** of text input
- **Emotion detection** using transformer models
- **Sentiment scoring** (-1.0 to +1.0 scale)
- **Trend analysis** over conversation sessions
- **Custom models** trained for therapeutic contexts

### 2. Conversation Manager
- **Context awareness** using conversation history
- **Session management** with state persistence
- **Turn-taking logic** for natural conversation flow
- **Crisis detection** and appropriate response protocols

### 3. Therapeutic Technique Engine
- **CBT (Cognitive Behavioral Therapy)** question generation
- **DBT (Dialectical Behavior Therapy)** skills integration
- **Mindfulness** and grounding techniques
- **Active listening** response patterns
- **Personalized interventions** based on user history

### 4. Voice Processing Pipeline
```
Audio Input → Whisper STT → Text Processing → GPT-4 → Text Response → ElevenLabs TTS → Audio Output
```

## Data Flow

1. **User Input** (text/voice) received by frontend
2. **Authentication** and session validation
3. **Voice-to-text** conversion if audio input
4. **Sentiment analysis** of user input
5. **Context retrieval** from conversation history
6. **AI processing** with therapeutic prompt engineering
7. **Response generation** with therapeutic techniques
8. **Text-to-speech** conversion if voice enabled
9. **Response delivery** to user interface
10. **Data persistence** for session continuity

## Security Architecture

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control
- Session timeout and management

### Data Protection
- AES-256 encryption for sensitive data at rest
- TLS 1.3 for data in transit
- Local storage only (no cloud dependencies)
- GDPR-compliant data handling

### Privacy Measures
- Zero-knowledge architecture
- Automatic data purging policies
- Consent management system
- Audit logging for compliance

## Deployment Architecture

### Server Configuration (180.181.230.73)
```
┌─────────────────────────────────────────┐
│              Nginx Reverse Proxy         │
│              (Port 3443 HTTPS)          │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐  ┌─────────────┐  ┌──────────┐
│ React   │  │ Express API │  │ Postgres │
│ App     │  │ Server      │  │ Database │
│ (Static)│  │ (Port 3001) │  │ (Port    │
│         │  │             │  │ 5432)    │
└─────────┘  └─────────────┘  └──────────┘
```

### Docker Containers
- `therapeutic-ai-frontend`: React application
- `therapeutic-ai-backend`: Node.js API server
- `therapeutic-ai-db`: PostgreSQL database
- `therapeutic-ai-nginx`: Reverse proxy and SSL termination

## Scalability Considerations

### Performance Optimization
- Response caching for common therapeutic responses
- Database query optimization
- Connection pooling for database access
- CDN for static assets

### Monitoring & Observability
- Application performance monitoring
- Error tracking and alerting
- User session analytics
- System health dashboards

### Backup & Recovery
- Automated database backups
- Disaster recovery procedures
- Data export capabilities
- System restore protocols