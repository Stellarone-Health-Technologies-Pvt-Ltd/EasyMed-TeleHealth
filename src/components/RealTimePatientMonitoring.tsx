import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Clock,
  Users,
  Smartphone,
  Watch,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDB } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  glucoseLevel?: number;
  respiratoryRate: number;
  timestamp: Date;
  deviceId?: string;
  deviceType?: 'apple_watch' | 'fitbit' | 'samsung_health' | 'manual';
}

interface PatientMonitoringData {
  patientId: string;
  patientName: string;
  status: 'stable' | 'monitoring' | 'critical' | 'emergency';
  lastUpdate: Date;
  vitals: VitalSigns;
  alerts: HealthAlert[];
  wearableConnected: boolean;
  locationStatus: 'home' | 'hospital' | 'unknown';
}

interface HealthAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  patientId: string;
}

interface RealTimePatientMonitoringProps {
  doctorId: string;
  viewMode?: 'dashboard' | 'individual';
  selectedPatientId?: string;
}

const RealTimePatientMonitoring: React.FC<RealTimePatientMonitoringProps> = ({
  doctorId,
  viewMode = 'dashboard',
  selectedPatientId
}) => {
  const [monitoredPatients, setMonitoredPatients] = useState<PatientMonitoringData[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<HealthAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientMonitoringData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>([]);

  useEffect(() => {
    // Monitor real-time patient data
    const patientsRef = ref(realtimeDB, `monitoring/doctors/${doctorId}/patients`);
    
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const patients = Object.entries(data).map(([patientId, patientData]: [string, any]) => ({
          patientId,
          ...patientData,
          lastUpdate: new Date(patientData.lastUpdate),
          vitals: {
            ...patientData.vitals,
            timestamp: new Date(patientData.vitals.timestamp)
          }
        }));
        setMonitoredPatients(patients);
      }
      setIsConnected(true);
    }, (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [doctorId]);

  useEffect(() => {
    // Monitor health alerts
    const alertsQuery = query(
      collection(firestore, 'healthAlerts'),
      where('doctorId', '==', doctorId),
      where('acknowledged', '==', false),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as HealthAlert[];
      setActiveAlerts(alerts);
    });

    return () => unsubscribe();
  }, [doctorId]);

  useEffect(() => {
    // Load vitals history for selected patient
    if (selectedPatientId) {
      const vitalsRef = ref(realtimeDB, `vitalsHistory/${selectedPatientId}`);
      const unsubscribe = onValue(vitalsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const history = Object.values(data).map((vital: any) => ({
            ...vital,
            timestamp: new Date(vital.timestamp)
          })).sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
          setVitalsHistory(history);
        }
      });

      return () => unsubscribe();
    }
  }, [selectedPatientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-50 border-green-200';
      case 'monitoring': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVitalStatus = (vital: string, value: number) => {
    const ranges = {
      heartRate: { normal: [60, 100], warning: [50, 120] },
      systolic: { normal: [90, 140], warning: [80, 160] },
      diastolic: { normal: [60, 90], warning: [50, 100] },
      temperature: { normal: [36.1, 37.2], warning: [35.5, 38.0] },
      oxygenSaturation: { normal: [95, 100], warning: [90, 94] },
      respiratoryRate: { normal: [12, 20], warning: [10, 25] }
    };

    const range = ranges[vital as keyof typeof ranges];
    if (!range) return 'normal';

    if (value >= range.normal[0] && value <= range.normal[1]) return 'normal';
    if (value >= range.warning[0] && value <= range.warning[1]) return 'warning';
    return 'critical';
  };

  const getVitalIcon = (vital: string) => {
    switch (vital) {
      case 'heartRate': return <Heart className="w-5 h-5" />;
      case 'temperature': return <Thermometer className="w-5 h-5" />;
      case 'oxygenSaturation': return <Activity className="w-5 h-5" />;
      case 'respiratoryRate': return <Zap className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const simulateWearableData = async (patientId: string) => {
    // Simulate receiving data from wearable devices
    const mockVitals = {
      heartRate: 72 + Math.random() * 20,
      bloodPressure: {
        systolic: 120 + Math.random() * 20,
        diastolic: 80 + Math.random() * 10
      },
      temperature: 36.5 + Math.random() * 0.8,
      oxygenSaturation: 96 + Math.random() * 4,
      respiratoryRate: 16 + Math.random() * 4,
      timestamp: new Date(),
      deviceType: 'apple_watch' as const,
      deviceId: 'AW-' + Math.random().toString(36).substr(2, 9)
    };

    // Save to Firebase Realtime Database
    const vitalsRef = ref(realtimeDB, `vitalsHistory/${patientId}/${Date.now()}`);
    await set(vitalsRef, mockVitals);

    // Update patient status
    const patientRef = ref(realtimeDB, `monitoring/doctors/${doctorId}/patients/${patientId}`);
    await set(patientRef, {
      patientId,
      patientName: `Patient ${patientId}`,
      status: 'monitoring',
      lastUpdate: new Date().toISOString(),
      vitals: mockVitals,
      wearableConnected: true,
      locationStatus: 'home'
    });
  };

  if (viewMode === 'individual' && selectedPatientId) {
    const patient = monitoredPatients.find(p => p.patientId === selectedPatientId);
    if (!patient) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Patient not found or not being monitored.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Individual Patient Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{patient.patientName}</h2>
                <p className="text-gray-500">Patient ID: {patient.patientId}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(patient.status)}`}>
              {patient.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{patient.vitals.heartRate}</div>
              <div className="text-sm text-gray-500">Heart Rate (bpm)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {patient.vitals.bloodPressure.systolic}/{patient.vitals.bloodPressure.diastolic}
              </div>
              <div className="text-sm text-gray-500">Blood Pressure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{patient.vitals.temperature.toFixed(1)}°C</div>
              <div className="text-sm text-gray-500">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{patient.vitals.oxygenSaturation}%</div>
              <div className="text-sm text-gray-500">Oxygen Saturation</div>
            </div>
          </div>
        </div>

        {/* Vitals History Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">24-Hour Vitals Trend</h3>
          <div className="space-y-4">
            {vitalsHistory.slice(0, 10).map((vital, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">
                  {vital.timestamp.toLocaleTimeString()}
                </span>
                <div className="flex gap-4 text-sm">
                  <span>HR: {vital.heartRate}</span>
                  <span>BP: {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}</span>
                  <span>SpO2: {vital.oxygenSaturation}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monitoring Dashboard Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Real-Time Patient Monitoring</h2>
              <p className="text-green-100">24/7 monitoring with AI-powered alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <><Wifi className="w-5 h-5" /> <span className="text-sm">Connected</span></>
            ) : (
              <><WifiOff className="w-5 h-5" /> <span className="text-sm">Disconnected</span></>
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Active Health Alerts ({activeAlerts.length})</h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm text-red-700">
                <span className="font-medium">{alert.patientId}:</span> {alert.message}
                <span className="text-red-500 ml-2">
                  ({alert.timestamp.toLocaleTimeString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitored Patients Grid */}
      <div className="grid gap-4">
        {monitoredPatients.length > 0 ? (
          monitoredPatients.map((patient) => (
            <div key={patient.patientId} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{patient.patientName}</h3>
                    <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </div>
                  {patient.wearableConnected && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Watch className="w-4 h-4" />
                      <span className="text-xs">Connected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${getVitalStatus('heartRate', patient.vitals.heartRate) === 'normal' ? 'text-green-600' : getVitalStatus('heartRate', patient.vitals.heartRate) === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {patient.vitals.heartRate}
                  </div>
                  <div className="text-xs text-gray-500">HR (bpm)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {patient.vitals.bloodPressure.systolic}/{patient.vitals.bloodPressure.diastolic}
                  </div>
                  <div className="text-xs text-gray-500">BP (mmHg)</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getVitalStatus('temperature', patient.vitals.temperature) === 'normal' ? 'text-green-600' : getVitalStatus('temperature', patient.vitals.temperature) === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {patient.vitals.temperature.toFixed(1)}°C
                  </div>
                  <div className="text-xs text-gray-500">Temp</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getVitalStatus('oxygenSaturation', patient.vitals.oxygenSaturation) === 'normal' ? 'text-green-600' : getVitalStatus('oxygenSaturation', patient.vitals.oxygenSaturation) === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {patient.vitals.oxygenSaturation}%
                  </div>
                  <div className="text-xs text-gray-500">SpO2</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Last update: {patient.lastUpdate.toLocaleTimeString()}</span>
                </div>
                <button
                  onClick={() => simulateWearableData(patient.patientId)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Being Monitored</h3>
            <p className="text-gray-500 mb-4">Start monitoring patients to see their real-time vitals here.</p>
            <button
              onClick={() => simulateWearableData('demo-patient-' + Date.now())}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Demo Patient
            </button>
          </div>
        )}
      </div>

      {/* Wearable Integration Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Wearable Device Integration
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">⌚</div>
            <div className="font-medium">Apple Watch</div>
            <div className="text-sm text-green-600">Connected</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📱</div>
            <div className="font-medium">Fitbit</div>
            <div className="text-sm text-green-600">Connected</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">⌚</div>
            <div className="font-medium">Samsung Health</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePatientMonitoring;