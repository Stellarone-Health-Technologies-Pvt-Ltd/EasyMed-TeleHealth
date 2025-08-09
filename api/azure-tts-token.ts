import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: any, res: any) { {
  try {
    const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
    const AZURE_REGION = process.env.AZURE_SPEECH_REGION; // e.g., 'southcentralus'
    if (!AZURE_KEY || !AZURE_REGION) {
      return res.status(500).json({ error: 'Missing Azure Speech credentials' });
    }
    const tokenResp = await fetch(`https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY }
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error('Azure token error:', txt);
      return res.status(500).json({ error: 'Failed to retrieve token' });
    }
    const token = await tokenResp.text();
    return res.status(200).json({ token, region: AZURE_REGION });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
