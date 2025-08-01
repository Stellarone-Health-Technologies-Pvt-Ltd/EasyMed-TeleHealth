import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HealthAnalyticsAssistantCardProps {
  onClick: () => void;
}

export default function HealthAnalyticsAssistantCard({ onClick }: HealthAnalyticsAssistantCardProps) {
  const { currentLanguage } = useLanguage();

  const texts = {
    english: {
      title: "Health Analytics AI",
      description: "Get personalized health insights, trend analysis, and actionable recommendations powered by AI",
      features: [
        "Personalized health trends",
        "Risk factor analysis",
        "Actionable recommendations",
        "Wellness planning"
      ]
    },
    hindi: {
      title: "स्वास्थ्य एनालिटिक्स एआई",
      description: "एआई द्वारा संचालित व्यक्तिगत स्वास्थ्य अंतर्दृष्टि, ट्रेंड विश्लेषण और कार्यनीति सिफारिशें प्राप्त करें",
      features: [
        "व्यक्तिगत स्वास्थ्य रुझान",
        "जोखिम कारक विश्लेषण",
        "कार्यनीति सिफारिशें",
        "कल्याण योजना"
      ]
    }
  };

  const getText = (key: keyof typeof texts.english) => {
    return texts[currentLanguage as keyof typeof texts]?.[key] || texts.english[key];
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 hover:border-purple-400 transition-all duration-300 cursor-pointer hover:shadow-lg group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white text-2xl group-hover:scale-110 transition-transform duration-300">
          📊
        </div>
        <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
          AI Powered
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
        {getText('title')}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {getText('description')}
      </p>
      
      <div className="space-y-2">
        {getText('features').map((feature, index) => (
          <div key={index} className="flex items-center text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700 transition-colors">
        <span>View Health Analytics</span>
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
