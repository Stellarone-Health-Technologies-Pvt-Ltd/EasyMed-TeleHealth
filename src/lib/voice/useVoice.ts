import { useCallback, useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { VOICE_MAP, VoiceMode } from "./voiceMap";
import i18n from "../../i18n"; // adjust path if your i18n instance lives elsewhere

const TOKEN_ENDPOINT = import.meta.env.VITE_SPEECH_TOKEN_ENDPOINT || "/api/azure-tts-token";

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;"
  );
}

export function useVoice() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const recRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  const fetchToken = useCallback(async () => {
    const res = await fetch(TOKEN_ENDPOINT, { method: "POST" });
    if (!res.ok) throw new Error("Failed to fetch Azure Speech token. Add the token API in Step 3.");
    return res.json() as Promise<{ token: string; region: string }>;
  }, []);

  const initRecognizer = useCallback(async (langCode: string) => {
    const { token, region } = await fetchToken();
    if (recRef.current) { try { recRef.current.close(); } catch {} recRef.current = null; }
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = langCode;
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recRef.current = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  }, [fetchToken]);

  const initSynth = useCallback(async (voiceName: string) => {
    const { token, region } = await fetchToken();
    if (synthRef.current) { try { synthRef.current.close(); } catch {} synthRef.current = null; }
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechSynthesisVoiceName = voiceName;
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    synthRef.current = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
  }, [fetchToken]);

  const listenOnce = useCallback(async (langCode: string) => {
    setLoading(true); setStatus("Requesting mic & listening…");
    try {
      await initRecognizer(langCode);
      if (!recRef.current) throw new Error("Recognizer not ready");
      return await new Promise<string>((resolve, reject) => {
        recRef.current!.recognizeOnceAsync(
          (result) => {
            if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) resolve(result.text || "");
            else reject(new Error("No speech recognized"));
          },
          (err) => reject(err)
        );
      });
    } finally {
      setLoading(false);
    }
  }, [initRecognizer]);

  const speak = useCallback(async (langCode: string, text: string, mode: VoiceMode = "normal") => {
    setLoading(true); setStatus("Speaking…");
    try {
      const voiceName = (VOICE_MAP[langCode] || VOICE_MAP["en-IN"])[mode];
      await initSynth(voiceName);
      if (!synthRef.current) throw new Error("Synth not ready");
      const style = mode === "normal" ? "empathetic" : "serious";
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${langCode}">
           <voice name="${voiceName}">
             <mstts:express-as style="${style}" styledegree="2">
               <prosody rate="0%">${escapeXml(text)}</prosody>
             </mstts:express-as>
           </voice>
         </speak>`;
      await new Promise<void>((resolve, reject) => {
        synthRef.current!.speakSsmlAsync(
          ssml,
          (r) => r.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted ? resolve() : reject(new Error("TTS failed")),
          (e) => reject(e)
        );
      });
    } finally {
      setLoading(false); setStatus("Done");
    }
  }, [initSynth]);

  useEffect(() => {
    return () => {
      try { recRef.current?.close(); } catch {}
      try { synthRef.current?.close(); } catch {}
    };
  }, []);

  return {
    loading, status, lastTranscript,
    async talk(onNLP?: (transcript: string, lang: string) => Promise<{ text: string, mode?: VoiceMode } | string>, mode: VoiceMode = "normal") {
      const lang = (i18n?.language as string) || "en-IN";
      const transcript = await listenOnce(lang);
      setLastTranscript(transcript);
      let reply: string | { text: string, mode?: VoiceMode } = i18n.t("voice.normal.reply", { lng: lang });
      if (onNLP) reply = await onNLP(transcript, lang);
      const isObj = typeof reply === "object";
      const text = isObj ? (reply as any).text : (reply as string);
      const m: VoiceMode = isObj && (reply as any).mode ? (reply as any).mode : mode;
      await speak(lang, text, m);
      return { transcript, reply: text, mode: m };
    }
  };
}