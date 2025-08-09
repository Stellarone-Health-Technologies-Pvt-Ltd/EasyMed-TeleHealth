# EasyMed Voice Assistant (Browser)

This doc explains the browser-based Speech-to-Text → NLP → Text-to-Speech flow with Azure Speech.

## Install
```bash
npm i microsoft-cognitiveservices-speech-sdk
```

## Env
Add to `.env.example` (no secrets here):
```
AZURE_SPEECH_REGION=southcentralus
VITE_SPEECH_TOKEN_ENDPOINT=/api/azure-tts-token
```

On Vercel, set **Environment Variables**:
- `AZURE_SPEECH_KEY` (Secret) — from Azure
- `AZURE_SPEECH_REGION` — e.g. `southcentralus`

## Files
- `src/lib/voice/voiceMap.ts`
- `src/lib/voice/useVoice.ts`
- `src/components/VoiceAssistant.tsx`
- `src/pages/VoiceTest.tsx`
- `api/azure-tts-token.ts`

## Usage
- Start dev server: `npm run dev`
- Open `/voice-test` route (add a router entry if needed)
- Click **Tap to Speak**, allow mic access
- You should see transcript + hear TTS in the selected i18n language

## Notes
- Do **not** expose Azure subscription key in the browser. The token API issues a short-lived token.
- Extend `VOICE_MAP` when you add Bengali/Marathi/Malayalam.
- Plug your NLP in `useVoice.talk(onNLP)`.
