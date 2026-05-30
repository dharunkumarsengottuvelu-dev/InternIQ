# InternIQ - AI-Powered Internship Recommendation Platform

InternIQ is a full-stack platform designed to bridge the gap between students and recruiters using AI. It features an automated ATS resume parser, customized AI-generated coding tests, and intelligent internship matching.

## 🚀 Tech Stack

### Frontend
- **React.js 18** with **Vite**
- **TailwindCSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Socket.io-client** for real-time updates (background tasks)

### Backend
- **Node.js** & **Express**
- **MongoDB** (Mongoose) for database
- **Redis** & **BullMQ** for background job queues (resume parsing, AI tests)
- **Socket.io** for real-time communication
- **Groq API / OpenAI** for LLM integrations
- **Pinecone** for vector search and recommendations

---

## 📂 Project Structure

The project is structured as a monorepo containing both the frontend client and the backend server.

```
InternIQ/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level components
│   │   ├── services/       # API integration layers
│   │   ├── store/          # Zustand global state
│   │   ├── lib/            # Utility functions
│   │   └── constants/      # App constants
│   └── package.json
│
├── server/                 # Backend Node.js Application
│   ├── src/
│   │   ├── config/         # Database and Queue configs
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, Upload, Rate Limiting
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # Express API Routes
│   │   ├── services/       # Core business logic (AI, email, etc.)
│   │   ├── utils/          # Error handling & logging
│   │   └── workers/        # BullMQ background processors
│   └── package.json
│
├── start-redis.ps1         # Convenience script to start local Redis (Windows)
└── package.json            # Root configuration for concurrently running both servers
```

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally on `mongodb://localhost:27017` or via MongoDB Atlas)
- **Redis** (running locally on port `6379`). A Windows portable version is included in `.redis-local`.

### 2. Environment Variables
Create a `.env` file in the `server` directory. Use the provided `.env.example` as a template:
```bash
cp server/.env.example server/.env
```
Fill in the necessary API keys (Groq/OpenAI, Pinecone, and your MongoDB connection string).

### 3. Installation
Install dependencies for both the frontend and backend from the root directory:
```bash
npm install --workspace=server
npm install --workspace=client
```

### 4. Running the Application
First, start your Redis server. If you are on Windows, you can use the provided script:
```bash
npm run redis:start
```

Then, start both the frontend and backend simultaneously:
```bash
npm run dev
```

- The **Client** will be available at: `http://localhost:5173`
- The **Server** will run at: `http://localhost:5000`

---

## 🔒 Security Features
- **Helmet.js** for secure HTTP headers.
- **Express-Rate-Limit** applied to global routes and strict limits on authentication routes.
- **Bcrypt** for password hashing.
- **JWT** (JSON Web Tokens) with separate short-lived access and long-lived refresh tokens.
- No sensitive data exposed in the frontend.

## ⚡ Performance Optimizations
- Route-level lazy loading (`React.lazy`) in the frontend.
- Heavy operations (Resume parsing via PDF, AI Test Generation) are strictly processed in the background using **BullMQ workers**, preventing API blocks.
- Real-time task progress via **WebSocket** instead of HTTP polling.
