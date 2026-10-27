import { handleRoutingRequest } from './_lib/routing.js';

/**
 * Serverless function for routing endpoint
 * Used in production (Vercel/Netlify)
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin: string) => origin.trim());
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

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
}
