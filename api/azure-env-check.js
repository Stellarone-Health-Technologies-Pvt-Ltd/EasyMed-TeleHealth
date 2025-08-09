export default function handler(req, res) {
  res.status(200).json({
    hasKey: !!process.env.AZURE_SPEECH_KEY,
    keyLength: process.env.AZURE_SPEECH_KEY
      ? process.env.AZURE_SPEECH_KEY.length
      : 0,
    hasRegion: !!process.env.AZURE_SPEECH_REGION,
    regionValue: process.env.AZURE_SPEECH_REGION || null,
    envList: Object.keys(process.env).filter(k =>
      k.includes('AZURE') || k.includes('VITE')
    )
  });
}
