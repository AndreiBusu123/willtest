# AI Therapeutic Conversation System - Frontend

A modern React + TypeScript frontend for the AI Therapeutic Conversation System, providing real-time chat, sentiment analysis, voice interaction, and comprehensive dashboard analytics.

## Features

- **Authentication System**: Secure login/register with JWT tokens
- **Real-time Chat Interface**: WebSocket-powered conversations with typing indicators
- **Sentiment Analysis**: Real-time emotion tracking and visualization
- **Voice Integration**: Speech-to-text and text-to-speech capabilities
- **Dashboard Analytics**: Comprehensive insights and progress tracking
- **Dark/Light Theme**: Therapeutic color schemes with accessibility features
- **Responsive Design**: Mobile-first approach with tablet/desktop optimization

## Tech Stack

- **React 18** with TypeScript
- **Material-UI v5** for components
- **Redux Toolkit** for state management
- **React Router v6** for navigation
- **Socket.io Client** for WebSocket connections
- **Recharts** for data visualization
- **Vite** for build tooling

## Installation

```bash
cd src/frontend
npm install
```

## Development

```bash
npm run dev
```

The application will run on http://localhost:5173

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=AI Therapeutic Conversation System
```

## Project Structure

```
src/frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── chat/         # Chat interface components
│   │   ├── voice/        # Voice recording components
│   │   ├── dashboard/    # Dashboard components
│   │   └── common/       # Shared components
│   ├── pages/            # Page components
│   ├── layouts/          # Layout components
│   ├── store/            # Redux store configuration
│   │   └── slices/       # Redux slices
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Theme and global styles
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
```

## API Integration

The frontend connects to the backend API at:
- Auth: `/api/auth/*`
- Conversations: `/api/conversations/*`
- Sentiment: `/api/sentiment/*`
- Voice: `/api/voice/*`
- WebSocket: `ws://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
