import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MedicationAssistantCardProps {
  onClick: () => void;
}

export default function MedicationAssistantCard({ onClick }: MedicationAssistantCardProps) {
  const { currentLanguage } = useLanguage();

  const texts = {
    english: {
      title: "Medication AI Assistant",
      description: "Get AI-powered medication guidance, check drug interactions, and manage your medications safely",
      features: [
        "Drug interaction checker",
        "Dosage guidance",
        "Side effect information",
        "Natural language queries"
      ]
    },
    hindi: {
      title: "दवा एआई सहायक",
      description: "एआई-संचालित दवा मार्गदर्शन प्राप्त करें, दवा की बातचीत जांचें, और अपनी दवाओं को सुरक्षित रूप से प्रबंधित करें",
      features: [
        "दवा बातचीत चेकर",
        "खुराक मार्गदर्शन",
        "दुष्प्रभाव जानकारी",
        "प्राकृतिक भाषा प्रश्न"
      ]
    }
  };

  const getText = (key: keyof typeof texts.english) => {
    return texts[currentLanguage as keyof typeof texts]?.[key] || texts.english[key];
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200 hover:border-green-400 transition-all duration-300 cursor-pointer hover:shadow-lg group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white text-2xl group-hover:scale-110 transition-transform duration-300">
          💊
        </div>
        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
          AI Powered
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-700 transition-colors">
        {getText('title')}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {getText('description')}
      </p>
      
      <div className="space-y-2">
        {getText('features').map((feature, index) => (
          <div key={index} className="flex items-center text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center text-green-600 text-sm font-medium group-hover:text-green-700 transition-colors">
        <span>Start Medication Chat</span>
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
