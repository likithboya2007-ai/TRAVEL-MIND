import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAttractionsRequest } from './_lib/attractions.js';

/**
 * Serverless function: POST /api/attractions
 * Generate AI-powered attractions for non-curated destinations
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract JWT token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Call shared handler
  const result = await handleAttractionsRequest({
    ...req.body,
    token,
  });

  // Return response
  if (result.success) {
    return res.status(result.status).json({ attractions: result.attractions });
  } else {
    return res.status(result.status).json({ error: result.error });
  }
}
