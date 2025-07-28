# Smart Assistant - AI Productivity Tool

A full-stack MERN application featuring an AI-powered productivity assistant with chat, notes, custom prompts, and notifications.

## Features

- User authentication (login/signup)
- AI chat interface with conversation history
- Web search integration
- Block notes system
- Custom AI prompts
- AI-powered notifications

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **AI Services**: OpenRouter API
- **Search**: X-RapidAPI

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   - `npm install` (root)
   - `npm install` (client)
   - `npm install` (server)

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update values as needed

4. Run the application:
   - Development: `npm run dev`
   - Production: `npm start`

## Deployment

- Frontend: Deploy `client/dist` to Netlify or similar
- Backend: Deploy to any Node.js hosting platform