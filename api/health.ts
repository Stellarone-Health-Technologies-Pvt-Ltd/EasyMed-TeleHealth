// /api/health.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(_: VercelRequest, res: VercelResponse) {
  try {
    const client = await new MongoClient(process.env.MONGODB_URI!).connect();
    const ping = await client.db(process.env.DB_NAME || 'easymed').command({ ping: 1 });
    res.status(200).json({ ok: true, ping });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
