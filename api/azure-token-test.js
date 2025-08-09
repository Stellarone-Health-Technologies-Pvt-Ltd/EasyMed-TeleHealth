export default async function handler(req, res) {
  try {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return res.status(500).json({
        error: 'Missing Azure Speech credentials',
        hasKey: !!key,
        hasRegion: !!region
      });
    }

    const r = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key }
      }
    );

    const txt = await r.text();

    if (!r.ok) {
      return res.status(500).json({
        error: 'Azure returned an error',
        status: r.status,
        body: txt
      });
    }

    return res.status(200).json({
      ok: true,
      tokenLength: txt.length,
      sample: txt.slice(0, 10) + '...'
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Unknown server error'
    });
  }
}
