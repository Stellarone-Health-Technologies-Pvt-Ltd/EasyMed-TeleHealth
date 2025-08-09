import React, { useState } from "react";
import { useVoice } from "../lib/voice/useVoice";

type Props = {
  onNLP?: (transcript: string, lang: string) => Promise<{ text: string; mode?: "normal" | "emergency" } | string>;
};

export default function VoiceAssistant({ onNLP }: Props) {
  const { talk, loading, status, lastTranscript } = useVoice();
  const [lastReply, setLastReply] = useState<string>("—");

  async function handleClick() {
    try {
      const { reply } = await talk(onNLP);
      setLastReply(reply);
    } catch (e) {
      console.error(e);
      alert("Voice failed. Did you add the token API? (Step 3)");
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Talk to EasyMed</h3>
          <p className="text-sm text-gray-600">Ask about symptoms, medicines, or daily health tips.</p>
        </div>
        <button
          onClick={handleClick}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? "Listening…" : "Tap to Speak"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Last transcript</div>
          <div className="mt-1 text-sm">{lastTranscript || "—"}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Assistant reply</div>
          <div className="mt-1 text-sm">{lastReply}</div>
        </div>
        <div className="text-xs text-gray-500">{status || ""}</div>
      </div>
    </div>
  );
}