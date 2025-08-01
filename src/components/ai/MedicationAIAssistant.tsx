import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { voiceService } from '../../services/openai';

interface MedicationQuery {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  type: 'interaction' | 'dosage' | 'side_effects' | 'general';
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}

export default function MedicationAIAssistant() {
  const { currentLanguage } = useLanguage();
  const [queries, setQueries] = useState<MedicationQuery[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'interactions' | 'reminders'>('chat');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Translation texts
  const texts = {
    english: {
      medicationAssistant: "Medication AI Assistant",
      headerDescription: "Get intelligent medication guidance with AI-powered insights",
      askQuestion: "Ask about medications, dosages, interactions, or side effects",
      placeholder: "e.g., Can I take Aspirin with Warfarin? What are the side effects of Metformin?",
      send: "Send",
      processing: "Processing...",
      chat: "Chat",
      interactions: "Drug Interactions",
      reminders: "Reminders",
      myMedications: "My Medications",
      addMedication: "Add Medication",
      checkInteractions: "Check Interactions",
      noInteractions: "No known interactions found",
      minor: "Minor",
      moderate: "Moderate",
      major: "Major",
      disclaimer: "⚠️ This information is for educational purposes only. Always consult your healthcare provider before making medication decisions."
    },
    hindi: {
      medicationAssistant: "दवा एआई सहायक",
      headerDescription: "एआई-संचालित अंतर्दृष्टि के साथ बुद्धिमान दवा मार्गदर्शन प्राप्त करें",
      askQuestion: "दवाओं, खुराक, बातचीत या दुष्प्रभावों के बारे में पूछें",
      placeholder: "जैसे, क्या मैं वारफारिन के साथ एस्पिरिन ले सकता हूं? मेटफॉर्मिन के दुष्प्रभाव क्या हैं?",
      send: "भेजें",
      processing: "प्रसंस्करण...",
      chat: "चैट",
      interactions: "दवा बातचीत",
      reminders: "रिमाइंडर",
      myMedications: "मेरी दवाएं",
      addMedication: "दवा जोड़ें",
      checkInteractions: "बातचीत जांचें",
      noInteractions: "कोई ज्ञात बातचीत नहीं मिली",
      minor: "मामूली",
      moderate: "मध्यम",
      major: "प्रमुख",
      disclaimer: "⚠️ यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है। दवा संबंधी निर्णय लेने से पहले हमेशा अपने स्वास्थ्य सेवा प्रदाता से सलाह लें।"
    }
  };

  const getText = (key: keyof typeof texts.english): string => {
    return texts[currentLanguage as keyof typeof texts]?.[key] || texts.english[key];
  };

  useEffect(() => {
    scrollToBottom();
  }, [queries]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendQuery = async () => {
    if (!currentQuery.trim() || isProcessing) return;

    const queryId = Date.now().toString();
    const newQuery: MedicationQuery = {
      id: queryId,
      query: currentQuery,
      response: '',
      timestamp: new Date(),
      type: 'general'
    };

    setQueries(prev => [...prev, newQuery]);
    setCurrentQuery('');
    setIsProcessing(true);

    try {
      const response = await voiceService.processHealthQuery(
        `Medication question: ${currentQuery}`,
        currentLanguage,
        { type: 'medication_query' }
      );
      
      setQueries(prev => 
        prev.map(q => 
          q.id === queryId ? { ...q, response } : q
        )
      );
    } catch (error) {
      console.error('Error processing medication query:', error);
      setQueries(prev => 
        prev.map(q => 
          q.id === queryId ? { 
            ...q, 
            response: 'Sorry, I encountered an error processing your question. Please try again.' 
          } : q
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const addMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications(prev => [...prev, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setMedications(prev => prev.filter(med => med !== medication));
  };

  const checkDrugInteractions = async () => {
    if (medications.length < 2) return;
    
    setIsProcessing(true);
    try {
      // This would typically call a specialized drug interaction API
      // For now, we'll use our OpenAI service with a specific prompt
      const response = await voiceService.processHealthQuery(
        `Check for drug interactions between these medications: ${medications.join(', ')}. Provide detailed interaction information including severity levels.`,
        currentLanguage,
        { type: 'drug_interaction_check' }
      );
      
      // In a real implementation, you'd parse the response and create DrugInteraction objects
      // For demo purposes, we'll show the response as text
      const newQuery: MedicationQuery = {
        id: Date.now().toString(),
        query: `Drug interaction check for: ${medications.join(', ')}`,
        response: response,
        timestamp: new Date(),
        type: 'interaction'
      };
      
      setQueries(prev => [...prev, newQuery]);
      setActiveTab('chat');
    } catch (error) {
      console.error('Error checking drug interactions:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderChatTab = () => (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {queries.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">💊</div>
            <p>{getText('askQuestion')}</p>
          </div>
        ) : (
          queries.map((query) => (
            <div key={query.id} className="space-y-3">
              {/* User Query */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs lg:max-w-md">
                  <p className="text-sm">{query.query}</p>
                  <span className="text-xs opacity-75">
                    {query.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {/* AI Response */}
              {query.response && (
                <div className="flex justify-start">
                  <div className="bg-white border p-3 rounded-lg max-w-xs lg:max-w-md">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">🤖</span>
                      <span className="text-sm font-medium text-gray-600">Medication AI</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{query.response}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">{getText('processing')}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
          placeholder={getText('placeholder')}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        />
        <button
          onClick={handleSendQuery}
          disabled={!currentQuery.trim() || isProcessing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {getText('send')}
        </button>
      </div>
    </div>
  );

  const renderInteractionsTab = () => (
    <div className="space-y-6">
      {/* My Medications */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">{getText('myMedications')}</h3>
        
        {/* Add Medication */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMedication()}
            placeholder="Enter medication name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addMedication}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {getText('addMedication')}
          </button>
        </div>

        {/* Medication List */}
        <div className="space-y-2">
          {medications.map((medication, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">💊</span>
                <span className="font-medium">{medication}</span>
              </div>
              <button
                onClick={() => removeMedication(medication)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {medications.length >= 2 && (
          <button
            onClick={checkDrugInteractions}
            disabled={isProcessing}
            className="mt-4 w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {getText('checkInteractions')}
          </button>
        )}
      </div>
    </div>
  );

  const renderRemindersTab = () => (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">{getText('reminders')}</h3>
      <p className="text-gray-600">Medication reminder feature coming soon...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">💊 {getText('medicationAssistant')}</h1>
        <p className="text-green-100">{getText('headerDescription')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'chat', label: getText('chat'), icon: '💬' },
            { id: 'interactions', label: getText('interactions'), icon: '⚠️' },
            { id: 'reminders', label: getText('reminders'), icon: '⏰' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'interactions' && renderInteractionsTab()}
        {activeTab === 'reminders' && renderRemindersTab()}
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p>{getText('disclaimer')}</p>
      </div>
    </div>
  );
}
