import app, { getMongoDb } from '../server';

export default async function handler(req: any, res: any) {
  // Ensure MongoDB Atlas connection attempt is initiated on warm/cold invocations
  try {
    await getMongoDb();
  } catch (err) {
    console.warn('Vercel serverless DB connect notice:', err);
  }

  return app(req, res);
}
