// Simple Express server to handle API routes during development
// In production, deploy api/chat.ts and api/routing.ts as serverless functions (Vercel/Netlify)

import express from 'express';
import dotenv from 'dotenv';
import { handleChatRequest } from './api/_lib/chat.ts';
import { handleRoutingRequest } from './api/_lib/routing.ts';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

// CORS configuration with allowlist
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/api/chat', async (req, res) => {
  const { message, tripContext, conversationHistory } = req.body;
  
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  const result = await handleChatRequest({
    message,
    tripContext,
    conversationHistory,
    token,
  });
  
  return res.status(result.status).json(
    result.success 
      ? { response: result.response, success: true }
      : { error: result.error }
  );
});

// OpenRouteService proxy endpoint
app.post('/api/routing', async (req, res) => {
  const { coordinates, profile, options } = req.body;
  
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  const result = await handleRoutingRequest({
    coordinates,
    profile,
    options,
    token,
  });
  
  return res.status(result.status).json(
    result.success 
      ? result.data
      : { error: result.error }
  );
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Copilot: Groq (${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'})`);
  console.log(`📡 Endpoints: /api/chat | /api/routing`);
  console.log(`🔒 Auth required | Rate limits: Chat ${process.env.CHAT_RATE_LIMIT || 20}/10min, Routing ${process.env.ROUTING_RATE_LIMIT || 60}/10min`);
});
