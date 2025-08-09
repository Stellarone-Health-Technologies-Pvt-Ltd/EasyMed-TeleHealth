import React from "react";
import VoiceAssistant from "../components/VoiceAssistant";

export default function VoiceTest() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">EasyMed TeleHealth — Voice Test</h1>
          <p className="text-gray-600">Multilingual voice-first healthcare for India</p>
        </header>

        <section>
          <VoiceAssistant />
        </section>
      </div>
    </div>
  );
}