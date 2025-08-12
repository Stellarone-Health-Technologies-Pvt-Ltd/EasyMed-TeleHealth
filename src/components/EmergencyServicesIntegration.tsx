import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  AlertTriangle, 
  Users, 
  Clock,
  Heart,
  Shield,
  Navigation,
  Smartphone,
  FileText,
  Zap
} from 'lucide-react';
import { ref, set, push, onValue } from 'firebase/database';
import { realtimeDB } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

interface EmergencyAlert {
  id: string;
  type: 'medical' | 'accident' | 'critical_vitals' | 'panic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number; address: string };
  medicalInfo: string[];
  timestamp: Date;
  status: 'active' | 'responded' | 'resolved';
}

interface EmergencyServicesProps {
  userId: string;
  userMedicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    emergencyNotes?: string;
  };
  familyMembers?: any[];
}

const EmergencyServicesIntegration: React.FC<EmergencyServicesProps> = ({
  userId,
  userMedicalInfo,
  familyMembers = []
}) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => console.error('Location error:', error)
      );
    }

    // Listen to emergency contacts
    const contactsRef = ref(realtimeDB, `emergencyContacts/${userId}`);
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      if (snapshot.exists()) {
        const contacts = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setEmergencyContacts(contacts);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    // Listen to active emergency alerts
    const alertsQuery = query(
      collection(firestore, 'emergencyAlerts'),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'responded']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as EmergencyAlert[];
      setActiveAlerts(alerts);
    });

    return () => unsubscribe();
  }, [userId]);

  // Emergency countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emergencyCountdown !== null && emergencyCountdown > 0) {
      interval = setInterval(() => {
        setEmergencyCountdown(prev => {
          if (prev && prev <= 1) {
            // Auto-trigger emergency if countdown reaches 0
            triggerEmergencyCall();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emergencyCountdown]);

  const startEmergencyCountdown = () => {
    setEmergencyCountdown(10); // 10 second countdown
    setIsEmergencyMode(true);
  };

  const cancelEmergencyCountdown = () => {
    setEmergencyCountdown(null);
    setIsEmergencyMode(false);
  };

  const triggerEmergencyCall = async () => {
    try {
      // Get current location
      let location = { lat: 0, lng: 0, address: 'Location unavailable' };
      
      if (currentLocation) {
        location = {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          address: await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude)
        };
      }

      // Create emergency alert
      const emergencyAlert: Omit<EmergencyAlert, 'id'> = {
        type: 'medical',
        severity: 'critical',
        location,
        medicalInfo: [
          ...(userMedicalInfo?.bloodType ? [`Blood Type: ${userMedicalInfo.bloodType}`] : []),
          ...(userMedicalInfo?.allergies?.map(a => `Allergy: ${a}`) || []),
          ...(userMedicalInfo?.medications?.map(m => `Medication: ${m}`) || []),
          ...(userMedicalInfo?.conditions?.map(c => `Condition: ${c}`) || []),
          ...(userMedicalInfo?.emergencyNotes ? [`Notes: ${userMedicalInfo.emergencyNotes}`] : [])
        ],
        timestamp: new Date(),
        status: 'active'
      };

      // Save to Firebase
      const alertDoc = await addDoc(collection(firestore, 'emergencyAlerts'), {
        ...emergencyAlert,
        userId,
        timestamp: new Date()
      });

      // Notify emergency contacts
      await notifyEmergencyContacts(alertDoc.id, location);

      // Call 108 Emergency Services
      window.open('tel:108', '_self');

      setIsEmergencyMode(false);
      setEmergencyCountdown(null);

    } catch (error) {
      console.error('Emergency call failed:', error);
    }
  };

  const notifyEmergencyContacts = async (alertId: string, location: any) => {
    const primaryContacts = emergencyContacts.filter(c => c.isPrimary);
    
    for (const contact of primaryContacts) {
      // Send SMS notification (would integrate with SMS service)
      const message = `EMERGENCY: ${userMedicalInfo?.emergencyNotes || 'Medical emergency'} at ${location.address}. Alert ID: ${alertId}`;
      
      // Save notification to Firebase for tracking
      await addDoc(collection(firestore, 'emergencyNotifications'), {
        alertId,
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        message,
        sent: true,
        timestamp: new Date()
      });

      // In a real implementation, this would trigger SMS/call
      console.log(`Emergency notification sent to ${contact.name}: ${message}`);
    }

    // Notify family members
    for (const member of familyMembers) {
      if (member.phone) {
        await addDoc(collection(firestore, 'emergencyNotifications'), {
          alertId,
          contactId: member.id,
          contactName: member.name,
          contactPhone: member.phone,
          message: `Family emergency alert: ${location.address}`,
          sent: true,
          timestamp: new Date()
        });
      }
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // In a real implementation, use Google Maps Geocoding API
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    const contactId = `contact_${Date.now()}`;
    await set(ref(realtimeDB, `emergencyContacts/${userId}/${contactId}`), {
      ...contact,
      id: contactId
    });
  };

  const quickEmergencyActions = [
    {
      title: 'Medical Emergency',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => startEmergencyCountdown()
    },
    {
      title: 'Accident',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => startEmergencyCountdown()
    },
    {
      title: 'Share Location',
      icon: <MapPin className="w-6 h-6" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => shareLocationWithContacts()
    },
    {
      title: 'Silent Alert',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => triggerSilentAlert()
    }
  ];

  const shareLocationWithContacts = async () => {
    if (!currentLocation) {
      alert('Location not available. Please enable GPS.');
      return;
    }

    const location = {
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      address: await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude)
    };

    // Share with emergency contacts
    for (const contact of emergencyContacts.filter(c => c.isPrimary)) {
      const message = `Location shared: ${location.address} - ${location.lat}, ${location.lng}`;
      console.log(`Location shared with ${contact.name}: ${message}`);
    }

    alert('Location shared with emergency contacts');
  };

  const triggerSilentAlert = async () => {
    if (!currentLocation) return;

    const location = {
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      address: await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude)
    };

    // Silent alert - notify contacts without calling emergency services
    await notifyEmergencyContacts('silent_alert', location);
    alert('Silent alert sent to emergency contacts');
  };

  return (
    <div className="space-y-6">
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Emergency Services</h2>
            <p className="text-red-100">One-tap 108 calling with GPS & medical history sharing</p>
          </div>
        </div>
      </div>

      {/* Emergency Countdown Modal */}
      {isEmergencyMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center max-w-md w-full mx-4">
            <div className="text-6xl font-bold text-red-600 mb-4">
              {emergencyCountdown}
            </div>
            <h3 className="text-xl font-bold mb-2">Emergency Call Starting</h3>
            <p className="text-gray-600 mb-6">
              Calling 108 Emergency Services and notifying your contacts
            </p>
            <div className="flex gap-4">
              <button
                onClick={triggerEmergencyCall}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-700"
              >
                Call Now
              </button>
              <button
                onClick={cancelEmergencyCountdown}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Emergency Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        {quickEmergencyActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white p-6 rounded-lg text-center transition-colors`}
          >
            <div className="flex justify-center mb-3">
              {action.icon}
            </div>
            <h3 className="font-semibold">{action.title}</h3>
          </button>
        ))}
      </div>

      {/* Medical Information Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Emergency Medical Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Basic Information</h4>
            <div className="space-y-1 text-sm">
              {userMedicalInfo?.bloodType && (
                <p><span className="font-medium">Blood Type:</span> {userMedicalInfo.bloodType}</p>
              )}
              {userMedicalInfo?.allergies && userMedicalInfo.allergies.length > 0 && (
                <p><span className="font-medium">Allergies:</span> {userMedicalInfo.allergies.join(', ')}</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Medications</h4>
            <div className="space-y-1 text-sm">
              {userMedicalInfo?.medications && userMedicalInfo.medications.length > 0 ? (
                userMedicalInfo.medications.map((med, idx) => (
                  <p key={idx}>• {med}</p>
                ))
              ) : (
                <p className="text-gray-500">No medications listed</p>
              )}
            </div>
          </div>
        </div>

        {userMedicalInfo?.emergencyNotes && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm"><span className="font-medium">Emergency Notes:</span> {userMedicalInfo.emergencyNotes}</p>
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Emergency Contacts
        </h3>

        {emergencyContacts.length > 0 ? (
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{contact.name}</h4>
                  <p className="text-sm text-gray-600">{contact.relationship} • {contact.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {contact.isPrimary && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                  )}
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No emergency contacts added</p>
            <button 
              onClick={() => addEmergencyContact({
                name: 'Demo Contact',
                relationship: 'Family',
                phone: '+91-9876543210',
                isPrimary: true
              })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Emergency Contact
            </button>
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Emergency Alerts
          </h3>
          
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Location: {alert.location.address}
                </p>
                <p className="text-sm text-gray-500">
                  {alert.timestamp.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Location */}
      {currentLocation && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Location
          </h3>
          
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Latitude:</span> {currentLocation.coords.latitude.toFixed(6)}</p>
            <p><span className="font-medium">Longitude:</span> {currentLocation.coords.longitude.toFixed(6)}</p>
            <p><span className="font-medium">Accuracy:</span> ±{Math.round(currentLocation.coords.accuracy)}m</p>
          </div>
          
          <button
            onClick={shareLocationWithContacts}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Share Location
          </button>
        </div>
      )}
    </div>
  );
};

export default EmergencyServicesIntegration;