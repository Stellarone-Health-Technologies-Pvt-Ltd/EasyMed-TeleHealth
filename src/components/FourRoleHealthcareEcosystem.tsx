import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Shield, 
  UserCheck,
  Activity,
  Brain,
  Calendar,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Heart,
  Database,
  Settings,
  Bell,
  FileText,
  Video
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { firestore, realtimeDB } from '../config/firebase';
import AdvancedAIHealthAssistant from './AdvancedAIHealthAssistant';
import RealTimePatientMonitoring from './RealTimePatientMonitoring';
import EnhancedVoiceAssistantFirebase from './EnhancedVoiceAssistantFirebase';

interface User {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'asha' | 'admin';
  email: string;
  phone?: string;
  specialization?: string;
  location?: string;
  permissions?: string[];
}

interface FourRoleHealthcareEcosystemProps {
  currentUser: User;
  onRoleSwitch?: (role: string) => void;
}

const FourRoleHealthcareEcosystem: React.FC<FourRoleHealthcareEcosystemProps> = ({
  currentUser,
  onRoleSwitch
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  useEffect(() => {
    // Listen to role-specific notifications
    const notificationsQuery = query(
      collection(firestore, 'notifications'),
      where('recipientId', '==', currentUser.id),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  useEffect(() => {
    // Listen to real-time dashboard stats
    const statsRef = ref(realtimeDB, `dashboardStats/${currentUser.role}/${currentUser.id}`);
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setDashboardStats(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, currentUser.role]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'patient': return <Users className="w-6 h-6" />;
      case 'doctor': return <Stethoscope className="w-6 h-6" />;
      case 'asha': return <UserCheck className="w-6 h-6" />;
      case 'admin': return <Shield className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'doctor': return 'text-green-600 bg-green-50 border-green-200';
      case 'asha': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'admin': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderPatientDashboard = () => (
    <div className="space-y-6">
      {/* Patient Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Welcome, {currentUser.name}</h2>
            <p className="text-blue-100">Your complete health companion with AI assistance</p>
          </div>
        </div>
      </div>

      {/* Quick Health Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">AI Health Check</h3>
              <p className="text-sm text-gray-500">Analyze symptoms</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Book Appointment</h3>
              <p className="text-sm text-gray-500">Schedule consultation</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold">Vital Signs</h3>
              <p className="text-sm text-gray-500">Monitor health</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold">Family Health</h3>
              <p className="text-sm text-gray-500">Manage family</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Health Assistant Integration */}
      <AdvancedAIHealthAssistant 
        patientId={currentUser.id}
        patientData={{
          age: 30,
          gender: 'male',
          chronicConditions: [],
          medicalHistory: []
        }}
      />
    </div>
  );

  const renderDoctorDashboard = () => (
    <div className="space-y-6">
      {/* Doctor Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Stethoscope className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Dr. {currentUser.name}</h2>
            <p className="text-green-100">Real-time patient monitoring & AI-powered diagnostics</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.patientsToday || 0}</div>
            <div className="text-sm text-green-100">Patients Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.emergencyAlerts || 0}</div>
            <div className="text-sm text-green-100">Emergency Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.onlineConsultations || 0}</div>
            <div className="text-sm text-green-100">Online Consultations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.criticalPatients || 0}</div>
            <div className="text-sm text-green-100">Critical Patients</div>
          </div>
        </div>
      </div>

      {/* Real-Time Patient Monitoring */}
      <RealTimePatientMonitoring doctorId={currentUser.id} />

      {/* Doctor Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Telemedicine
          </h3>
          <p className="text-sm text-gray-600 mb-4">Start video consultations with patients</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full">
            Start Consultation
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Diagnostics
          </h3>
          <p className="text-sm text-gray-600 mb-4">Review AI-generated health insights</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full">
            View Insights
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Queue
          </h3>
          <p className="text-sm text-gray-600 mb-4">Manage urgent patient cases</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full">
            View Emergency
          </button>
        </div>
      </div>
    </div>
  );

  const renderAshaDashboard = () => (
    <div className="space-y-6">
      {/* ASHA Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <UserCheck className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">ASHA Worker - {currentUser.name}</h2>
            <p className="text-purple-100">Community health monitoring & AI-powered assistance</p>
          </div>
        </div>

        {/* ASHA Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.householdsVisited || 0}</div>
            <div className="text-sm text-purple-100">Households Visited</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.healthScreenings || 0}</div>
            <div className="text-sm text-purple-100">Health Screenings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.referrals || 0}</div>
            <div className="text-sm text-purple-100">Doctor Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.trainingsCompleted || 0}</div>
            <div className="text-sm text-purple-100">Trainings Completed</div>
          </div>
        </div>
      </div>

      {/* ASHA Tools */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Health Assessment
          </h3>
          <p className="text-sm text-gray-600 mb-4">AI-powered community health screening</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 w-full">
            Start Assessment
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Collection
          </h3>
          <p className="text-sm text-gray-600 mb-4">Collect and sync community health data</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full">
            Collect Data
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Training Modules
          </h3>
          <p className="text-sm text-gray-600 mb-4">Access healthcare training content</p>
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 w-full">
            View Training
          </button>
        </div>
      </div>

      {/* Community Health Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Community Health Insights
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium mb-2">High Priority Cases</h4>
            <p className="text-sm text-gray-600">3 households need immediate attention</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Vaccination Coverage</h4>
            <p className="text-sm text-gray-600">85% coverage in your area</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Admin - {currentUser.name}</h2>
            <p className="text-red-100">System management, analytics & compliance monitoring</p>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.totalUsers || 0}</div>
            <div className="text-sm text-red-100">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.activeDoctor || 0}</div>
            <div className="text-sm text-red-100">Active Doctors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.systemAlerts || 0}</div>
            <div className="text-sm text-red-100">System Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{dashboardStats.complianceScore || 0}%</div>
            <div className="text-sm text-red-100">Compliance Score</div>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </h3>
          <p className="text-sm text-gray-600 mb-4">Manage users, roles, and permissions</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full">
            Manage Users
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-4">View system analytics and insights</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full">
            View Analytics
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </h3>
          <p className="text-sm text-gray-600 mb-4">Configure system settings and compliance</p>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full">
            System Config
          </button>
        </div>
      </div>

      {/* Compliance Monitoring */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          HIPAA Compliance & Security
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800">Data Encryption</h4>
            <p className="text-sm text-green-600">All medical data encrypted end-to-end</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800">Audit Logs</h4>
            <p className="text-sm text-blue-600">Complete access logging enabled</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoleDashboard = () => {
    switch (currentUser.role) {
      case 'patient': return renderPatientDashboard();
      case 'doctor': return renderDoctorDashboard();
      case 'asha': return renderAshaDashboard();
      case 'admin': return renderAdminDashboard();
      default: return renderPatientDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Role Indicator */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">EasyMed Pro</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(currentUser.role)}`}>
                <div className="flex items-center gap-2">
                  {getRoleIcon(currentUser.role)}
                  <span className="capitalize">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {getRoleIcon(currentUser.role)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderRoleDashboard()}
      </main>

      {/* Enhanced Voice Assistant - Available for all roles */}
      <EnhancedVoiceAssistantFirebase
        userId={currentUser.id}
        currentPage={`${currentUser.role}-dashboard`}
        patientData={currentUser.role === 'patient' ? currentUser : undefined}
        onCommand={(command) => {
          console.log(`${currentUser.role} voice command:`, command);
        }}
      />
    </div>
  );
};

export default FourRoleHealthcareEcosystem;