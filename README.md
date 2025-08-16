# AI Sentiment Analysis & Therapeutic Conversation System

## Project Overview

This project develops an AI-powered therapeutic conversation system that:
- Accepts text or voice input of user thoughts and emotions
- Performs real-time sentiment analysis and emotional state detection
- Responds with therapeutic probing questions and evidence-based techniques
- Provides personalized advice and emotional support

## Technology Stack

### Backend
- **Framework**: Node.js with Express
- **AI/ML**: OpenAI GPT-4 for conversation, custom sentiment analysis models
- **Database**: PostgreSQL for conversation history, user profiles
- **Authentication**: JWT-based authentication
- **Voice Processing**: OpenAI Whisper for speech-to-text, ElevenLabs for text-to-speech

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI or Tailwind CSS
- **State Management**: Redux Toolkit
- **Real-time Communication**: WebSockets for live conversation

### Infrastructure
- **Hosting**: User's webserver (180.181.230.73)
- **Containerization**: Docker for deployment
- **SSL**: HTTPS on port 3443
- **Database**: PostgreSQL container
- **Reverse Proxy**: Nginx

## Key Features

1. **Multi-modal Input**: Text and voice input support
2. **Sentiment Analysis**: Real-time emotional state detection
3. **Therapeutic Techniques**: CBT, DBT, mindfulness-based interventions
4. **Conversation Memory**: Context-aware responses using conversation history
5. **Privacy-First**: All data stored locally on user's server
6. **Adaptive Learning**: System learns user's patterns and preferences

## Security & Privacy

- End-to-end encryption for sensitive data
- Local data storage only
- GDPR/HIPAA-compliant data handling
- Secure authentication and session management

## Development Phases

1. **Phase 1**: Core sentiment analysis and basic conversation
2. **Phase 2**: Voice integration and advanced therapeutic techniques
3. **Phase 3**: UI/UX development and user testing
4. **Phase 4**: Deployment and production optimization

## Getting Started

See individual component documentation in `/docs` directory.