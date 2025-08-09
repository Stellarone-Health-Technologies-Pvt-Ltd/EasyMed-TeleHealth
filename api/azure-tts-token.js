// /api/azure-tts-token.js  (Vercel serverless)
export default async function handler(req, res) {
  try {
    const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
    const AZURE_REGION = process.env.AZURE_SPEECH_REGION; // e.g. 'southcentralus'
    if (!AZURE_KEY || !AZURE_REGION) {
      return res.status(500).json({ error: 'Missing Azure Speech credentials' });
    }
    const r = await fetch(`https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY }
    });
    if (!r.ok) return res.status(500).json({ error: 'Failed to retrieve token' });
    const token = await r.text();
    return res.status(200).json({ token, region: AZURE_REGION });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
