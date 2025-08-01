import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { voiceService, Symptom, DiagnosisResult } from '../../services/openai';

export default function IntelligentSymptomChecker() {
  const { currentLanguage } = useLanguage();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ age: '', gender: '', existingConditions: [] as string[] });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [naturalLanguageSymptoms, setNaturalLanguageSymptoms] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMediaFile(e.target.files[0]);
    }
  };

  const analyzeSymptoms = async () => {
    setIsAnalyzing(true);
    try {
      const result = await voiceService.analyzeSymptomsWithAI(
        selectedSymptoms,
        patientInfo,
        naturalLanguageSymptoms,
        currentLanguage
      );
      setDiagnosisResult(result);
    } catch (error) {
      console.error('Symptom analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="symptom-checker">
      <h1>Intelligent Symptom Checker</h1>
      <textarea 
        value={naturalLanguageSymptoms} 
        onChange={(e) => setNaturalLanguageSymptoms(e.target.value)} 
        placeholder="Describe your symptoms..."
      />
      <input type="file" accept="image/*,video/*" onChange={handleFileUpload} />
      <button onClick={analyzeSymptoms} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
      </button>
      {diagnosisResult && (
        <div>
          <h2>Diagnosis Result</h2>
          <p>Condition: {diagnosisResult.condition}</p>
          <p>Probability: {diagnosisResult.probability}%</p>
          <p>Severity: {diagnosisResult.severity}</p>
          <div>
            <h3>Recommendations:</h3>
            <ul>
              {diagnosisResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
