import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Watch, 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bluetooth,
  Battery,
  Zap
} from 'lucide-react';
import { ref, set, push, onValue } from 'firebase/database';
import { realtimeDB } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface WearableDevice {
  id: string;
  name: string;
  type: 'apple_watch' | 'fitbit' | 'samsung_health' | 'google_fit';
  connected: boolean;
  batteryLevel?: number;
  lastSync: Date;
  capabilities: string[];
}

interface HealthMetrics {
  heartRate: number;
  steps: number;
  calories: number;
  sleepHours: number;
  activeMinutes: number;
  bloodOxygen?: number;
  stressLevel?: number;
  timestamp: Date;
  deviceId: string;
}

interface WearableIntegrationProps {
  userId: string;
  onHealthDataUpdate?: (metrics: HealthMetrics) => void;
}

const WearableDeviceIntegration: React.FC<WearableIntegrationProps> = ({
  userId,
  onHealthDataUpdate
}) => {
  const [connectedDevices, setConnectedDevices] = useState<WearableDevice[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<HealthMetrics | null>(null);
  const [healthTrends, setHealthTrends] = useState<HealthMetrics[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Available wearable device types
  const availableDevices = [
    {
      type: 'apple_watch' as const,
      name: 'Apple Watch',
      icon: '⌚',
      capabilities: ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'ecg'],
      color: 'bg-gray-800'
    },
    {
      type: 'fitbit' as const,
      name: 'Fitbit',
      icon: '📱',
      capabilities: ['heart_rate', 'steps', 'sleep', 'stress', 'activity'],
      color: 'bg-green-600'
    },
    {
      type: 'samsung_health' as const,
      name: 'Samsung Health',
      icon: '⌚',
      capabilities: ['heart_rate', 'steps', 'sleep', 'blood_pressure', 'stress'],
      color: 'bg-blue-600'
    },
    {
      type: 'google_fit' as const,
      name: 'Google Fit',
      icon: '📱',
      capabilities: ['heart_rate', 'steps', 'activity', 'weight'],
      color: 'bg-red-500'
    }
  ];

  useEffect(() => {
    // Listen to connected devices
    const devicesRef = ref(realtimeDB, `wearableDevices/${userId}`);
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devices = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          lastSync: new Date(data.lastSync)
        }));
        setConnectedDevices(devices);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    // Listen to real-time health metrics
    const metricsRef = ref(realtimeDB, `healthMetrics/${userId}/current`);
    const unsubscribe = onValue(metricsRef, (snapshot) => {
      if (snapshot.exists()) {
        const metrics = {
          ...snapshot.val(),
          timestamp: new Date(snapshot.val().timestamp)
        };
        setCurrentMetrics(metrics);
        
        if (onHealthDataUpdate) {
          onHealthDataUpdate(metrics);
        }
      }
    });

    return () => unsubscribe();
  }, [userId, onHealthDataUpdate]);

  useEffect(() => {
    // Listen to health trends from Firestore
    const trendsQuery = query(
      collection(firestore, 'healthMetrics'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(24) // Last 24 data points
    );

    const unsubscribe = onSnapshot(trendsQuery, (snapshot) => {
      const trends = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as HealthMetrics[];
      setHealthTrends(trends.reverse()); // Reverse to show chronological order
    });

    return () => unsubscribe();
  }, [userId]);

  // Apple HealthKit Integration
  const connectAppleWatch = async () => {
    setIsConnecting('apple_watch');
    
    try {
      // Simulate Apple HealthKit integration
      if ('navigator' in window && 'health' in (window.navigator as any)) {
        // Real Apple HealthKit integration would go here
        console.log('Requesting Apple HealthKit permissions...');
      }

      // Simulate successful connection
      await simulateDeviceConnection('apple_watch', 'Apple Watch Series 9');
      
    } catch (error) {
      console.error('Apple Watch connection failed:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  // Google Fit Integration
  const connectGoogleFit = async () => {
    setIsConnecting('google_fit');
    
    try {
      // Simulate Google Fit API integration
      console.log('Requesting Google Fit permissions...');
      
      // Real Google Fit integration would use the Fitness API
      // await gapi.load('auth2', initGoogleFit);
      
      await simulateDeviceConnection('google_fit', 'Google Fit');
      
    } catch (error) {
      console.error('Google Fit connection failed:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  // Samsung Health Integration
  const connectSamsungHealth = async () => {
    setIsConnecting('samsung_health');
    
    try {
      // Simulate Samsung Health SDK integration
      console.log('Requesting Samsung Health permissions...');
      
      await simulateDeviceConnection('samsung_health', 'Samsung Galaxy Watch');
      
    } catch (error) {
      console.error('Samsung Health connection failed:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  // Fitbit Integration
  const connectFitbit = async () => {
    setIsConnecting('fitbit');
    
    try {
      // Simulate Fitbit Web API integration
      console.log('Requesting Fitbit permissions...');
      
      await simulateDeviceConnection('fitbit', 'Fitbit Versa 4');
      
    } catch (error) {
      console.error('Fitbit connection failed:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  const simulateDeviceConnection = async (type: string, name: string) => {
    const deviceId = `${type}_${Date.now()}`;
    const device: WearableDevice = {
      id: deviceId,
      name,
      type: type as any,
      connected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      lastSync: new Date(),
      capabilities: availableDevices.find(d => d.type === type)?.capabilities || []
    };

    // Save device to Firebase
    await set(ref(realtimeDB, `wearableDevices/${userId}/${deviceId}`), device);

    // Start simulating health data
    setTimeout(() => simulateHealthData(deviceId, type), 2000);
  };

  const simulateHealthData = async (deviceId: string, deviceType: string) => {
    const baseMetrics = {
      heartRate: 72 + Math.random() * 20,
      steps: Math.floor(Math.random() * 5000) + 3000,
      calories: Math.floor(Math.random() * 500) + 200,
      sleepHours: 6 + Math.random() * 3,
      activeMinutes: Math.floor(Math.random() * 60) + 30,
      timestamp: new Date(),
      deviceId
    };

    // Add device-specific metrics
    let metrics: HealthMetrics = baseMetrics;
    
    if (deviceType === 'apple_watch') {
      metrics = {
        ...baseMetrics,
        bloodOxygen: Math.floor(Math.random() * 5) + 95
      };
    } else if (deviceType === 'fitbit') {
      metrics = {
        ...baseMetrics,
        stressLevel: Math.floor(Math.random() * 40) + 20
      };
    }

    // Save current metrics to Firebase Realtime Database
    await set(ref(realtimeDB, `healthMetrics/${userId}/current`), metrics);

    // Save historical data to Firestore
    await addDoc(collection(firestore, 'healthMetrics'), {
      ...metrics,
      userId,
      timestamp: new Date()
    });
  };

  const syncDeviceData = async (deviceId: string) => {
    setSyncStatus('syncing');
    
    try {
      const device = connectedDevices.find(d => d.id === deviceId);
      if (!device) return;

      // Simulate data sync
      await simulateHealthData(deviceId, device.type);
      
      // Update last sync time
      await set(ref(realtimeDB, `wearableDevices/${userId}/${deviceId}/lastSync`), new Date().toISOString());
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    await set(ref(realtimeDB, `wearableDevices/${userId}/${deviceId}/connected`), false);
  };

  const getDeviceInfo = (type: string) => {
    return availableDevices.find(d => d.type === type);
  };

  const getMetricTrend = (metric: keyof HealthMetrics) => {
    if (healthTrends.length < 2) return 'stable';
    
    const recent = healthTrends.slice(-2);
    const current = recent[1][metric] as number;
    const previous = recent[0][metric] as number;
    
    if (current > previous * 1.05) return 'up';
    if (current < previous * 0.95) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Watch className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Wearable Device Integration</h2>
            <p className="text-indigo-100">Real-time health data sync with Firebase</p>
          </div>
        </div>
      </div>

      {/* Connected Devices */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bluetooth className="w-5 h-5" />
          Connected Devices ({connectedDevices.filter(d => d.connected).length})
        </h3>

        {connectedDevices.filter(d => d.connected).length > 0 ? (
          <div className="space-y-4">
            {connectedDevices.filter(d => d.connected).map((device) => {
              const deviceInfo = getDeviceInfo(device.type);
              return (
                <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${deviceInfo?.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {deviceInfo?.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-gray-500">
                        Last sync: {device.lastSync.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {device.batteryLevel && (
                      <div className="flex items-center gap-1 text-sm">
                        <Battery className="w-4 h-4" />
                        <span>{device.batteryLevel}%</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => syncDeviceData(device.id)}
                      disabled={syncStatus === 'syncing'}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => disconnectDevice(device.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <WifiOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No devices connected</p>
        )}
      </div>

      {/* Current Health Metrics */}
      {currentMetrics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Health Metrics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-red-600" />
                {getTrendIcon(getMetricTrend('heartRate'))}
              </div>
              <div className="text-2xl font-bold text-red-600">{Math.round(currentMetrics.heartRate)}</div>
              <div className="text-sm text-gray-500">Heart Rate (bpm)</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                {getTrendIcon(getMetricTrend('steps'))}
              </div>
              <div className="text-2xl font-bold text-blue-600">{currentMetrics.steps.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Steps</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                {getTrendIcon(getMetricTrend('calories'))}
              </div>
              <div className="text-2xl font-bold text-green-600">{Math.round(currentMetrics.calories)}</div>
              <div className="text-sm text-gray-500">Calories</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                {getTrendIcon(getMetricTrend('activeMinutes'))}
              </div>
              <div className="text-2xl font-bold text-purple-600">{Math.round(currentMetrics.activeMinutes)}</div>
              <div className="text-sm text-gray-500">Active Minutes</div>
            </div>
          </div>

          {/* Additional Metrics */}
          {(currentMetrics.bloodOxygen || currentMetrics.stressLevel) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {currentMetrics.bloodOxygen && (
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="text-lg font-bold text-cyan-600">{currentMetrics.bloodOxygen}%</div>
                  <div className="text-sm text-gray-500">Blood Oxygen</div>
                </div>
              )}
              
              {currentMetrics.stressLevel && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{Math.round(currentMetrics.stressLevel)}</div>
                  <div className="text-sm text-gray-500">Stress Level</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Available Devices to Connect */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Connect New Device
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {availableDevices.map((device) => {
            const isConnected = connectedDevices.some(d => d.type === device.type && d.connected);
            const isConnecting_ = isConnecting === device.type;
            
            return (
              <div key={device.type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${device.color} rounded-lg flex items-center justify-center text-xl`}>
                      {device.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-gray-500">{device.capabilities.length} capabilities</p>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <button
                      onClick={() => {
                        switch (device.type) {
                          case 'apple_watch': connectAppleWatch(); break;
                          case 'google_fit': connectGoogleFit(); break;
                          case 'samsung_health': connectSamsungHealth(); break;
                          case 'fitbit': connectFitbit(); break;
                        }
                      }}
                      disabled={isConnecting_}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {isConnecting_ ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {device.capabilities.map((capability) => (
                    <span key={capability} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {capability.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus !== 'idle' && (
        <div className={`p-4 rounded-lg ${
          syncStatus === 'syncing' ? 'bg-blue-50 border-blue-200' :
          syncStatus === 'success' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin" />}
            {syncStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {syncStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
            
            <span className="text-sm font-medium">
              {syncStatus === 'syncing' && 'Syncing device data...'}
              {syncStatus === 'success' && 'Data synced successfully!'}
              {syncStatus === 'error' && 'Sync failed. Please try again.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WearableDeviceIntegration;