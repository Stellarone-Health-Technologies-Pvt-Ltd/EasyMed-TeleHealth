export type VoiceMode = "normal" | "emergency";

export const VOICE_MAP: Record<string, { normal: string; emergency: string }> = {
  "en-IN": { normal: "en-IN-NeerjaNeural",  emergency: "en-IN-PrabhatNeural"  },
  "hi-IN": { normal: "hi-IN-SwaraNeural",   emergency: "hi-IN-MadhurNeural"   },
  "ta-IN": { normal: "ta-IN-PadmaNeural",   emergency: "ta-IN-ValluvarNeural" },
  "te-IN": { normal: "te-IN-SreeNeural",    emergency: "te-IN-ChaitanyaNeural"},
  "kn-IN": { normal: "kn-IN-ManjulaNeural", emergency: "kn-IN-GuruNeural"     }
};