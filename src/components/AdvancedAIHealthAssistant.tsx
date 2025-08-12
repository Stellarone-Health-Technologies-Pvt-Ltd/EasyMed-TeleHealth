import React, { useState, useEffect } from 'react';
import { Brain, Heart, AlertTriangle, TrendingUp, User, MessageCircle, Loader } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface HealthInsight {
  id: string;
  type: 'risk_assessment' | 'personalized_insight' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  aiConfidence: number;
}

interface SymptomAnalysisResult {
  symptoms: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  urgency: boolean;
  confidence: number;
  possibleConditions: string[];
}

interface AdvancedAIHealthAssistantProps {
  patientId: string;
  patientData?: any;
}

const AdvancedAIHealthAssistant: React.FC<AdvancedAIHealthAssistantProps> = ({
  patientId,
  patientData
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState('');

  // Firebase Cloud Function for AI-powered symptom analysis
  const analyzeSymptoms = httpsCallable(functions, 'analyzeSymptoms');
  const generateHealthInsights = httpsCallable(functions, 'generateHealthInsights');

  useEffect(() => {
    // Listen to real-time health insights
    const insightsQuery = query(
      collection(firestore, 'healthInsights', patientId, 'insights'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(insightsQuery, (snapshot) => {
      const insights = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as HealthInsight[];
      setHealthInsights(insights);
    });

    return () => unsubscribe();
  }, [patientId]);

  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);
    try {
      // Call Firebase Cloud Function for AI analysis
      const result = await analyzeSymptoms({
        symptoms: symptoms,
        patientId: patientId,
        patientHistory: patientData?.medicalHistory || [],
        demographics: {
          age: patientData?.age,
          gender: patientData?.gender,
          conditions: patientData?.chronicConditions || []
        }
      });

      const analysis = result.data as SymptomAnalysisResult;
      setAnalysisResult(analysis);

      // Save analysis to Firestore for future reference
      await addDoc(collection(firestore, 'symptomAnalyses'), {
        patientId,
        symptoms,
        analysis,
        timestamp: new Date(),
        aiProcessed: true
      });

      // Generate personalized health insights
      await generatePersonalizedInsights(analysis);

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      // Fallback to local analysis
      performLocalSymptomAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performLocalSymptomAnalysis = () => {
    // Basic local analysis as fallback
    const symptomKeywords = symptoms.toLowerCase().split(/[,\s]+/);
    const riskKeywords = ['chest pain', 'difficulty breathing', 'severe headache', 'high fever'];
    
    const hasHighRiskSymptoms = riskKeywords.some(keyword => 
      symptomKeywords.some(symptom => symptom.includes(keyword.replace(' ', '')))
    );

    const result: SymptomAnalysisResult = {
      symptoms: symptomKeywords,
      riskLevel: hasHighRiskSymptoms ? 'high' : 'medium',
      recommendations: hasHighRiskSymptoms 
        ? ['Seek immediate medical attention', 'Call emergency services if severe']
        : ['Monitor symptoms', 'Schedule consultation if symptoms persist'],
      urgency: hasHighRiskSymptoms,
      confidence: 0.7,
      possibleConditions: hasHighRiskSymptoms 
        ? ['Requires immediate evaluation']
        : ['General symptoms - needs assessment']
    };

    setAnalysisResult(result);
  };

  const generatePersonalizedInsights = async (analysis: SymptomAnalysisResult) => {
    try {
      const insights = await generateHealthInsights({
        patientId,
        analysisResult: analysis,
        patientData: patientData
      });

      // The Cloud Function will automatically save insights to Firestore
      // which will trigger our real-time listener
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'low': return <Heart className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Health Assistant Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Health Assistant</h2>
            <p className="text-blue-100">Advanced symptom analysis with predictive insights</p>
          </div>
        </div>
      </div>

      {/* Symptom Input */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Describe Your Symptoms
        </h3>
        
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe your symptoms in detail... (e.g., 'I have a headache, feel dizzy, and have been nauseous for 2 hours')"
          className="w-full p-4 border border-gray-200 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <button
          onClick={handleSymptomAnalysis}
          disabled={isAnalyzing || !symptoms.trim()}
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyze Symptoms
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">AI Analysis Results</h3>
          
          <div className={`p-4 rounded-lg border-2 mb-4 ${getSeverityColor(analysisResult.riskLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getRiskIcon(analysisResult.riskLevel)}
              <span className="font-semibold capitalize">
                {analysisResult.riskLevel} Risk Level
              </span>
              <span className="text-sm">
                (AI Confidence: {Math.round(analysisResult.confidence * 100)}%)
              </span>
            </div>
            {analysisResult.urgency && (
              <p className="text-sm font-medium text-red-600">
                ⚠️ Urgent attention recommended
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {analysisResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Possible Conditions:</h4>
              <ul className="space-y-1">
                {analysisResult.possibleConditions.map((condition, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Health Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Personalized Health Insights
        </h3>
        
        {healthInsights.length > 0 ? (
          <div className="space-y-3">
            {healthInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <span className="text-xs text-gray-500">
                    {insight.timestamp?.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{insight.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span>AI Confidence: {Math.round(insight.aiConfidence * 100)}%</span>
                  <span className="capitalize bg-white px-2 py-1 rounded">
                    {insight.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No insights available yet. Analyze symptoms to get personalized recommendations.
          </p>
        )}
      </div>

      {/* Emergency Actions */}
      <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Emergency Actions
        </h3>
        <p className="text-sm text-red-700 mb-4">
          If you're experiencing severe symptoms, don't wait for AI analysis.
        </p>
        <div className="flex gap-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2">
            <span>📞</span>
            Call 108 Emergency
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact Doctor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIHealthAssistant;