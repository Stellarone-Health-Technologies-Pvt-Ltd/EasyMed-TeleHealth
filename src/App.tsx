import { useState } from "react";
import PatientDashboard from "./components/PatientDashboard";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import FloatingVoiceAssistant from "./components/FloatingVoiceAssistant";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import "./App.css";

interface User {
  userType: "patient" | "doctor" | "admin" | "asha";
  name: string;
  phone?: string;
  email?: string;
  role?: string;
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
    userType: "patient",
    userInfo: any,
  ) => {
    const newUser: User = {
      userType: "patient",
      name: userInfo.name,
      phone: userInfo.phone,
      email: userInfo.email,
      role: "patient",
    };

    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
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
            {/* Main Content - Patient Dashboard */}
            <PatientDashboard userInfo={currentUser} onLogout={handleLogout} />

            {/* Medini - Floating Voice Assistant */}
            <FloatingVoiceAssistant onCommand={handleVoiceCommand} />
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
