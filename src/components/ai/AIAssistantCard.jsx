import React from 'react';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';

const AIAssistantCard = ({ onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-3 rounded-lg group-hover:bg-blue-700 transition-colors">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Health Assistant</h3>
            <p className="text-sm text-gray-600">24/7 health support</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-blue-500" />
      </div>
      
      <p className="text-sm text-gray-700 mb-4">
        Get instant answers to your health questions, symptom guidance, and wellness tips from our AI assistant.
      </p>
      
      <div className="flex items-center space-x-2 text-blue-600">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">Start Conversation</span>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-1">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Symptoms</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Medications</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Wellness</span>
      </div>
    </div>
  );
};

export default AIAssistantCard;
