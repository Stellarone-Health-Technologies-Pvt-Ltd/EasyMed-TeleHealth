export default function handler(req, res) {
  res.status(200).json({
    hasKey: !!process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION || null
  });
}
