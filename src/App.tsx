import { useState } from "react";
import PatientDashboard from "./components/PatientDashboard";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import FloatingVoiceAssistant from "./components/FloatingVoiceAssistant";
import FourRoleHealthcareEcosystem from "./components/FourRoleHealthcareEcosystem";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import "./App.css";

interface User {
  id: string;
  userType: "patient" | "doctor" | "admin" | "asha";
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  specialization?: string;
  location?: string;
  permissions?: string[];
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { currentLanguage, setLanguage } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'dashboard'>('home');

  const languageOptions = [
    { code: "english", name: "English", flag: "🇺🇸" },
    { code: "hindi", name: "हिंदी", flag: "🇮🇳" },
    { code: "tamil", name: "தமிழ்", flag: "🇮🇳" },
    { code: "telugu", name: "తెలుగు", flag: "🇮🇳" },
    { code: "kannada", name: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "malayalam", name: "മലയാളം", flag: "🇮🇳" },
    { code: "marathi", name: "मराठी", flag: "🇮🇳" },
  ];

  const handleLogin = (
    userType: "patient" | "doctor" | "admin" | "asha",
    userInfo: any,
  ) => {
    const newUser: User = {
      id: `user_${Date.now()}`, // Generate unique ID
      userType,
      name: userInfo.name,
      phone: userInfo.phone,
      email: userInfo.email,
      role: userType,
      specialization: userType === 'doctor' ? userInfo.specialization : undefined,
      location: userInfo.location,
      permissions: getUserPermissions(userType)
    };

    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const getUserPermissions = (userType: string) => {
    switch (userType) {
      case 'doctor': return ['patient_monitoring', 'prescriptions', 'consultations', 'ai_diagnostics'];
      case 'admin': return ['user_management', 'system_config', 'analytics', 'compliance'];
      case 'asha': return ['community_health', 'data_collection', 'training', 'screening'];
      default: return ['health_records', 'appointments', 'family_management', 'ai_assistant'];
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  // Handle voice commands from Medini (Voice Assistant)
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    
    switch (command) {
      case 'start':
        // Navigate to consultation booking for patient
        console.log('Starting consultation booking for patient');
        break;
      case 'next':
        // Navigate to next step in current flow
        console.log('Moving to next step');
        break;
      case 'back':
        // Navigate back in current flow
        console.log('Going back');
        break;
      default:
        console.log('Unhandled voice command:', command);
    }
  };

  // Render based on current view
  switch (currentView) {
    case 'home':
      return (
        <div className="min-h-screen bg-white">
          <HomePage onNavigateToLogin={handleNavigateToLogin} />
        </div>
      );
    case 'login':
      return (
        <div className="min-h-screen bg-white">
          <LoginPage onLogin={handleLogin} />
        </div>
      );
    case 'dashboard':
      if (isLoggedIn && currentUser) {
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Use the new 4-Role Healthcare Ecosystem */}
            <FourRoleHealthcareEcosystem 
              currentUser={currentUser}
              onRoleSwitch={(role) => {
                console.log('Role switch requested:', role);
                // Handle role switching if needed
              }}
            />
          </div>
        );
      } else {
        // If not logged in but trying to access dashboard, redirect to login
        setCurrentView('login');
        return null;
      }
    default:
      return (
        <div className="min-h-screen bg-white">
          <HomePage onNavigateToLogin={handleNavigateToLogin} />
        </div>
      );
  }
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
