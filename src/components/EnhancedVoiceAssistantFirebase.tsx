import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone,
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  MessageCircle,
  Settings,
  Languages
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ref, push } from 'firebase/database';
import { realtimeDB } from '../config/firebase';
import { useLanguage } from "../contexts/LanguageContext";

interface VoiceCommand {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  language: string;
  originalText: string;
}

interface VoiceResponse {
  text: string;
  language: string;
  action?: {
    type: 'navigate' | 'call' | 'alert' | 'search' | 'booking';
    parameters: Record<string, any>;
  };
}

interface EnhancedVoiceAssistantProps {
  userId?: string;
  onCommand?: (command: VoiceCommand) => void;
  currentPage?: string;
  patientData?: any;
}

const EnhancedVoiceAssistant: React.FC<EnhancedVoiceAssistantProps> = ({
  userId,
  onCommand,
  currentPage = 'dashboard',
  patientData
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const dragRef = useRef({ offsetX: 0, offsetY: 0 });

  // Firebase Cloud Function for AI intent recognition (fallback to local if not available)
  const processVoiceCommand = async (data: any) => {
    try {
      const cloudFunction = httpsCallable(functions, 'processVoiceCommand');
      return await cloudFunction(data);
    } catch (error) {
      console.log('Cloud function not available, using local processing');
      return { data: null };
    }
  };

  // Supported languages with healthcare-specific commands
  const supportedLanguages = {
    'en-US': { name: 'English', flag: '🇺🇸', voice: 'en-US' },
    'hi-IN': { name: 'हिंदी', flag: '🇮🇳', voice: 'hi-IN' },
    'ta-IN': { name: 'தமிழ்', flag: '🇮🇳', voice: 'ta-IN' },
    'te-IN': { name: 'తెలుగు', flag: '🇮🇳', voice: 'te-IN' }
  };

  // Healthcare-specific voice commands
  const healthcareCommands = {
    'en-US': {
      emergency: ['call 108', 'emergency', 'help me', 'urgent'],
      symptoms: ['check symptoms', 'symptom checker', 'analyze symptoms', 'health check'],
      appointment: ['book appointment', 'schedule doctor', 'find doctor', 'consultation'],
      medication: ['my medicines', 'medication reminder', 'prescription', 'pills'],
      vitals: ['check vitals', 'blood pressure', 'heart rate', 'temperature'],
      family: ['family health', 'family members', 'add family member'],
      navigation: ['go to', 'open', 'show me', 'navigate to']
    },
    'hi-IN': {
      emergency: ['108 कॉल करें', 'आपातकाल', 'मदद करें', 'तुरंत'],
      symptoms: ['लक्षण जांचें', 'स्वास्थ्य जांच', 'बीमारी की जांच'],
      appointment: ['डॉक्टर से मिलें', 'अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें'],
      medication: ['दवाइयां', 'दवा की याद दिलाएं', 'नुस्खा'],
      vitals: ['स्वास्थ्य जांच', 'ब्लड प्रेशर', 'हृदय गति'],
      family: ['परिवार का स्वास्थ्य', 'परिवार के सदस्य']
    },
    'ta-IN': {
      emergency: ['108 அழை', 'அவசரம்', 'உதவி', 'உடனே'],
      symptoms: ['அறிகுறி பரிசோதனை', 'உடல்நலம் பார்', 'நோய் பரிசோதனை'],
      appointment: ['மருத்துவர் சந்திப்பு', 'அப்பாய்ன்ட்மென்ட்', 'டாக்டர் தேடு'],
      medication: ['மருந்துகள்', 'மருந்து நினைவூட்டல்', 'மருத்துவ சீட்டு'],
      vitals: ['உடல்நலம் பார்', 'இரத்த அழுத்தம்', 'இதய துடிப்பு']
    },
    'te-IN': {
      emergency: ['108 కాల్ చేయండి', 'అత్యవసరం', 'సహాయం', 'వెంటనే'],
      symptoms: ['లక్షణాలు తనిఖీ', 'ఆరోగ్య పరీక్ష', 'వ్యాధి పరీక్ష'],
      appointment: ['డాక్టర్ అపాయింట్మెంట్', 'వైద్యుడిని కలవండి'],
      medication: ['మందులు', 'మందుల రిమైండర్', 'ప్రిస్క్రిప్షన్'],
      vitals: ['ఆరోగ్య పరీక్ష', 'బ్లడ్ ప్రెషర్', 'గుండె చప్పుడు']
    }
  };

  useEffect(() => {
    // Initialize speech recognition and synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage;

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentLanguage]);

  const handleSpeechResult = async (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    console.log('Voice input:', transcript);
    
    setIsProcessing(true);
    
    try {
      // Try Firebase Cloud Function for advanced AI processing
      const result = await processVoiceCommand({
        text: transcript,
        language: currentLanguage,
        userId: userId,
        context: {
          currentPage,
          patientData: patientData ? {
            hasChronicConditions: patientData.chronicConditions?.length > 0,
            age: patientData.age,
            gender: patientData.gender
          } : null
        }
      });

      if (result.data) {
        const commandData = result.data as { command: VoiceCommand; response: VoiceResponse };
        
        setLastCommand(commandData.command);
        
        // Execute the command
        await executeVoiceCommand(commandData.command, commandData.response);
        
        // Save command to Firebase for analytics
        if (userId) {
          try {
            await push(ref(realtimeDB, `voiceCommands/${userId}`), {
              ...commandData.command,
              timestamp: new Date().toISOString(),
              context: currentPage
            });
          } catch (error) {
            console.log('Unable to save to Firebase, continuing with local operation');
          }
        }

        // Callback to parent component
        if (onCommand) {
          onCommand(commandData.command);
        }
      } else {
        // Fallback to local processing
        await processCommandLocally(transcript);
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      // Fallback to local processing
      await processCommandLocally(transcript);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCommandLocally = async (transcript: string) => {
    // Local fallback processing
    const commands = healthcareCommands[currentLanguage as keyof typeof healthcareCommands] || healthcareCommands['en-US'];
    
    let detectedIntent = 'unknown';
    let confidence = 0.5;
    
    // Simple keyword matching for local processing
    for (const [intent, keywords] of Object.entries(commands)) {
      for (const keyword of keywords) {
        if (transcript.includes(keyword.toLowerCase())) {
          detectedIntent = intent;
          confidence = 0.8;
          break;
        }
      }
      if (detectedIntent !== 'unknown') break;
    }

    const command: VoiceCommand = {
      intent: detectedIntent,
      confidence,
      parameters: { query: transcript },
      language: currentLanguage,
      originalText: transcript
    };

    const response: VoiceResponse = {
      text: getLocalResponse(detectedIntent, currentLanguage),
      language: currentLanguage,
      action: getLocalAction(detectedIntent)
    };

    setLastCommand(command);
    await executeVoiceCommand(command, response);
  };

  const executeVoiceCommand = async (command: VoiceCommand, response: VoiceResponse) => {
    // Speak the response
    await speakText(response.text, response.language);
    
    // Execute any actions
    if (response.action) {
      switch (response.action.type) {
        case 'call':
          if (response.action.parameters.number === '108') {
            // Emergency call - show confirmation dialog
            if (confirm('Do you want to call 108 Emergency Services?')) {
              window.open(`tel:108`, '_self');
            }
          }
          break;
        case 'navigate':
          // Handle navigation based on the target
          console.log('Navigate to:', response.action.parameters.target);
          break;
        case 'search':
          // Handle search functionality
          console.log('Search for:', response.action.parameters.query);
          break;
        case 'booking':
          // Handle appointment booking
          console.log('Book appointment:', response.action.parameters);
          break;
        case 'alert':
          // Show health alert
          alert(response.action.parameters.message);
          break;
      }
    }
  };

  const getLocalResponse = (intent: string, language: string) => {
    const responses = {
      'en-US': {
        emergency: "Calling emergency services 108. Stay calm, help is on the way.",
        symptoms: "Opening symptom checker. Please describe your symptoms.",
        appointment: "I'll help you book an appointment. Which type of doctor do you need?",
        medication: "Showing your medication list and reminders.",
        vitals: "Displaying your vital signs and health metrics.",
        family: "Opening family health management section.",
        unknown: "I didn't understand that. Try saying 'Call 108', 'Check symptoms', or 'Book appointment'."
      },
      'hi-IN': {
        emergency: "आपातकालीन सेवा 108 को कॉल कर रहे हैं। शांत रहें, मदद आ रही है।",
        symptoms: "लक्षण जांचकर्ता खोल रहे हैं। कृपया अपने लक्षण बताएं।",
        appointment: "मैं आपकी अपॉइंटमेंट बुक करने में मदद करूंगा। आपको किस प्रकार के डॉक्टर की आवश्यकता है?",
        medication: "आपकी दवाइयों की सूची और रिमाइंडर दिखा रहे हैं।",
        vitals: "आपके स्वास्थ्य संकेतक दिखा रहे हैं।",
        unknown: "मैं समझ नहीं पाया। '108 कॉल करें', 'लक्षण जांचें', या 'अपॉइंटमेंट बुक करें' कहकर कोशिश करें।"
      }
    };

    const langResponses = responses[language as keyof typeof responses] || responses['en-US'];
    return langResponses[intent as keyof typeof langResponses] || langResponses.unknown;
  };

  const getLocalAction = (intent: string) => {
    switch (intent) {
      case 'emergency':
        return { type: 'call' as const, parameters: { number: '108' } };
      case 'symptoms':
        return { type: 'navigate' as const, parameters: { target: 'symptom-checker' } };
      case 'appointment':
        return { type: 'navigate' as const, parameters: { target: 'booking' } };
      case 'medication':
        return { type: 'navigate' as const, parameters: { target: 'medication' } };
      case 'vitals':
        return { type: 'navigate' as const, parameters: { target: 'vitals' } };
      default:
        return undefined;
    }
  };

  const speakText = (text: string, language: string) => {
    return new Promise<void>((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Find appropriate voice for the language
      const voices = synthRef.current.getVoices();
      const voice = voices.find(v => v.lang.startsWith(language.split('-')[0])) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = currentLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    setIsProcessing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragRef.current.offsetX,
        y: e.clientY - dragRef.current.offsetY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Main Voice Assistant Button */}
      <div className="relative">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : isProcessing 
              ? 'bg-yellow-500 text-white animate-spin' 
              : isSpeaking
              ? 'bg-green-500 text-white animate-bounce'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <Settings className="w-8 h-8 animate-spin" />
          ) : isListening ? (
            <Mic className="w-8 h-8" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Status Indicator */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
          {isListening && <div className="w-3 h-3 bg-red-400 rounded-full animate-ping"></div>}
          {isProcessing && <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>}
          {isSpeaking && <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>}
        </div>
      </div>

      {/* Quick Actions Panel */}
      {(isListening || isProcessing || isSpeaking) && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 min-w-64">
          <div className="text-center mb-3">
            <div className="text-sm font-medium text-gray-700">
              {isListening && "Listening..."}
              {isProcessing && "Processing with AI..."}
              {isSpeaking && "Speaking..."}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Language: {supportedLanguages[currentLanguage as keyof typeof supportedLanguages]?.name}
            </div>
          </div>

          {/* Quick Commands */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Quick Commands:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="p-2 bg-red-50 text-red-700 rounded flex items-center gap-1 hover:bg-red-100">
                <Phone className="w-3 h-3" />
                Call 108
              </button>
              <button className="p-2 bg-blue-50 text-blue-700 rounded flex items-center gap-1 hover:bg-blue-100">
                <Search className="w-3 h-3" />
                Check Symptoms
              </button>
              <button className="p-2 bg-green-50 text-green-700 rounded flex items-center gap-1 hover:bg-green-100">
                <Calendar className="w-3 h-3" />
                Book Appointment
              </button>
              <button className="p-2 bg-purple-50 text-purple-700 rounded flex items-center gap-1 hover:bg-purple-100">
                <MessageCircle className="w-3 h-3" />
                My Medicines
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-center gap-2">
              {Object.entries(supportedLanguages).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => setCurrentLanguage(code)}
                  className={`text-xs px-2 py-1 rounded ${
                    currentLanguage === code 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Last Command Display */}
      {lastCommand && !isListening && !isProcessing && !isSpeaking && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-3 max-w-sm">
          <div className="text-xs text-gray-500 mb-1">Last Command:</div>
          <div className="text-sm font-medium">{lastCommand.originalText}</div>
          <div className="text-xs text-gray-500 mt-1">
            Intent: {lastCommand.intent} ({Math.round(lastCommand.confidence * 100)}% confidence)
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVoiceAssistant;