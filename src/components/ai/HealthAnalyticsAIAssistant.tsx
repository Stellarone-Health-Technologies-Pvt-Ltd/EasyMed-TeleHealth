import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { voiceService, HealthMetric, HealthInsight } from '../../services/openai';

interface HealthAnalyticsProps {}

export default function HealthAnalyticsAIAssistant({}: HealthAnalyticsProps) {
  const { currentLanguage } = useLanguage();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const retrieveHealthMetrics = async () => {
    setIsProcessing(true);
    try {
      // Sample health metrics for demonstration
      const metrics: HealthMetric[] = [
        {
          id: 'weight',
          name: 'Weight',
          value: 70,
          unit: 'kg',
          trend: 'stable',
          status: 'normal',
          target: { min: 65, max: 75 },
          history: [
            { date: '2024-01-10', value: 70 },
            { date: '2024-01-17', value: 69 },
            { date: '2024-01-24', value: 70 },
          ],
        },
        {
          id: 'bmi',
          name: 'BMI',
          value: 22.3,
          unit: 'kg/m²',
          trend: 'down',
          status: 'normal',
          target: { min: 18.5, max: 24.9 },
          history: [
            { date: '2024-01-10', value: 22.5 },
            { date: '2024-01-17', value: 22.4 },
            { date: '2024-01-24', value: 22.3 },
          ],
        },
        {
          id: 'bloodPressure',
          name: 'Blood Pressure',
          value: 120,
          unit: 'mmHg (120/80)',
          trend: 'up',
          status: 'warning',
          target: { min: 110, max: 130 },
          history: [
            { date: '2024-01-10', value: 118 },
            { date: '2024-01-17', value: 119 },
            { date: '2024-01-24', value: 120 },
          ],
        },
      ];

      setHealthMetrics(metrics);

      const insights = await voiceService.getPersonalizedHealthInsights(metrics, {
        age: '45',
        gender: 'male',
        existingConditions: ['Hypertension'],
      }, currentLanguage);

      setHealthInsights(insights);
    } catch (error) {
      console.error('Failed to retrieve health metrics:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📊 Health Analytics AI</h1>
        <p className="text-purple-100">Gain insights into your health with personalized AI-powered analysis</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <button
          onClick={retrieveHealthMetrics}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Analyze Health Metrics'}
        </button>

        {healthInsights.length > 0 && (
          <div className="mt-6 space-y-4">
            {healthInsights.map(insight => (
              <div key={insight.id} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                <p>{insight.description}</p>
                {insight.action && <p className="text-blue-600 font-medium">Action: {insight.action}</p>}
                <p className="text-sm text-gray-500">Priority: {insight.priority}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
