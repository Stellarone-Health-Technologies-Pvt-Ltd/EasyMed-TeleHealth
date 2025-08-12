import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Heart, 
  Calendar, 
  Pill,
  Activity,
  Bell,
  UserPlus,
  Edit,
  Shield,
  Baby,
  User,
  Crown,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, set, onValue, push } from 'firebase/database';
import { firestore, realtimeDB } from '../config/firebase';

interface FamilyMember {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'grandparent' | 'other';
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  lastCheckup?: Date;
  emergencyContact: boolean;
  profileImage?: string;
  abhaId?: string;
}

interface HealthRecord {
  id: string;
  memberId: string;
  type: 'vitals' | 'medication' | 'appointment' | 'symptom' | 'test_result';
  data: any;
  timestamp: Date;
  addedBy: string;
}

interface MedicationReminder {
  id: string;
  memberId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  nextDue: Date;
  completed: boolean;
}

interface FamilyHealthManagementProps {
  primaryUserId: string;
  userName: string;
}

const FamilyHealthManagement: React.FC<FamilyHealthManagementProps> = ({
  primaryUserId,
  userName
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [familyInsights, setFamilyInsights] = useState<any>({});

  useEffect(() => {
    // Listen to family members
    const membersQuery = query(
      collection(firestore, 'familyMembers'),
      where('primaryUserId', '==', primaryUserId)
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastCheckup: doc.data().lastCheckup?.toDate()
      })) as FamilyMember[];
      setFamilyMembers(members);
    });

    return () => unsubscribe();
  }, [primaryUserId]);

  useEffect(() => {
    // Listen to health records for all family members
    const memberIds = familyMembers.map(m => m.id);
    if (memberIds.length > 0) {
      const recordsQuery = query(
        collection(firestore, 'healthRecords'),
        where('memberId', 'in', memberIds)
      );

      const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as HealthRecord[];
        setHealthRecords(records);
      });

      return () => unsubscribe();
    }
  }, [familyMembers]);

  useEffect(() => {
    // Listen to medication reminders
    const remindersRef = ref(realtimeDB, `medicationReminders/${primaryUserId}`);
    const unsubscribe = onValue(remindersRef, (snapshot) => {
      if (snapshot.exists()) {
        const reminders = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          nextDue: new Date(data.nextDue)
        }));
        setMedicationReminders(reminders);
      }
    });

    return () => unsubscribe();
  }, [primaryUserId]);

  useEffect(() => {
    // Generate family health insights
    generateFamilyInsights();
  }, [familyMembers, healthRecords]);

  const addFamilyMember = async (memberData: Omit<FamilyMember, 'id'>) => {
    try {
      await addDoc(collection(firestore, 'familyMembers'), {
        ...memberData,
        primaryUserId,
        addedBy: primaryUserId,
        createdAt: new Date()
      });
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding family member:', error);
    }
  };

  const addHealthRecord = async (memberId: string, recordData: Omit<HealthRecord, 'id' | 'memberId' | 'timestamp' | 'addedBy'>) => {
    try {
      await addDoc(collection(firestore, 'healthRecords'), {
        ...recordData,
        memberId,
        timestamp: new Date(),
        addedBy: primaryUserId
      });
    } catch (error) {
      console.error('Error adding health record:', error);
    }
  };

  const addMedicationReminder = async (reminder: Omit<MedicationReminder, 'id'>) => {
    try {
      const reminderRef = ref(realtimeDB, `medicationReminders/${primaryUserId}/${Date.now()}`);
      await set(reminderRef, reminder);
    } catch (error) {
      console.error('Error adding medication reminder:', error);
    }
  };

  const generateFamilyInsights = () => {
    const insights = {
      totalMembers: familyMembers.length,
      avgAge: familyMembers.length > 0 ? Math.round(familyMembers.reduce((sum, m) => sum + m.age, 0) / familyMembers.length) : 0,
      commonAllergies: getCommonItems(familyMembers.flatMap(m => m.allergies)),
      commonConditions: getCommonItems(familyMembers.flatMap(m => m.chronicConditions)),
      upcomingCheckups: familyMembers.filter(m => {
        if (!m.lastCheckup) return true;
        const monthsSinceCheckup = (Date.now() - m.lastCheckup.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSinceCheckup > 12;
      }).length,
      medicationCount: medicationReminders.length,
      pendingReminders: medicationReminders.filter(r => !r.completed && new Date(r.nextDue) <= new Date()).length
    };

    setFamilyInsights(insights);
  };

  const getCommonItems = (items: string[]) => {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([item]) => item);
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'spouse': return <Heart className="w-5 h-5" />;
      case 'child': return <Baby className="w-5 h-5" />;
      case 'parent': return <Crown className="w-5 h-5" />;
      case 'sibling': return <Users className="w-5 h-5" />;
      case 'grandparent': return <Crown className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'spouse': return 'text-pink-600 bg-pink-50';
      case 'child': return 'text-blue-600 bg-blue-50';
      case 'parent': return 'text-purple-600 bg-purple-50';
      case 'sibling': return 'text-green-600 bg-green-50';
      case 'grandparent': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const MemberCard = ({ member }: { member: FamilyMember }) => (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedMember(member)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${getRelationshipColor(member.relationship)} rounded-full flex items-center justify-center`}>
            {getRelationshipIcon(member.relationship)}
          </div>
          <div>
            <h3 className="font-semibold">{member.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{member.relationship}, {member.age} years</p>
          </div>
        </div>
        {member.emergencyContact && (
          <Shield className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="space-y-2">
        {member.chronicConditions.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">{member.chronicConditions.length} condition(s)</span>
          </div>
        )}
        
        {member.medications.length > 0 && (
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">{member.medications.length} medication(s)</span>
          </div>
        )}

        {member.lastCheckup && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Last checkup: {member.lastCheckup.toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {member.bloodType && (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{member.bloodType}</span>
        )}
        {member.abhaId && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ABHA</span>
        )}
      </div>
    </div>
  );

  const AddMemberForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      relationship: 'spouse' as FamilyMember['relationship'],
      age: 25,
      gender: 'male' as FamilyMember['gender'],
      bloodType: '',
      allergies: [] as string[],
      medications: [] as string[],
      chronicConditions: [] as string[],
      emergencyContact: false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addFamilyMember(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add Family Member</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value as FamilyMember['relationship'] })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="120"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as FamilyMember['gender'] })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Blood Type</label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergencyContact"
                checked={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="emergencyContact" className="text-sm">Set as emergency contact</label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Family Health Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Family Health Management</h2>
              <p className="text-purple-100">Manage health records for entire family with Firebase sync</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Family Health Insights */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{familyInsights.totalMembers}</div>
          <div className="text-sm text-gray-500">Family Members</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{familyInsights.avgAge}</div>
          <div className="text-sm text-gray-500">Average Age</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-orange-600">{familyInsights.upcomingCheckups}</div>
          <div className="text-sm text-gray-500">Need Checkup</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-purple-600">{familyInsights.medicationCount}</div>
          <div className="text-sm text-gray-500">Medications</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-red-600">{familyInsights.pendingReminders}</div>
          <div className="text-sm text-gray-500">Pending Doses</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-indigo-600">{healthRecords.length}</div>
          <div className="text-sm text-gray-500">Health Records</div>
        </div>
      </div>

      {/* Medication Reminders */}
      {medicationReminders.filter(r => !r.completed && new Date(r.nextDue) <= new Date()).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800">
            <Bell className="w-5 h-5" />
            Pending Medication Reminders
          </h3>
          
          <div className="space-y-2">
            {medicationReminders
              .filter(r => !r.completed && new Date(r.nextDue) <= new Date())
              .map((reminder) => {
                const member = familyMembers.find(m => m.id === reminder.memberId);
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{reminder.medicationName}</p>
                      <p className="text-sm text-gray-600">
                        {member?.name} • {reminder.dosage} • Due: {reminder.nextDue.toLocaleTimeString()}
                      </p>
                    </div>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                      Mark Taken
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Family Members Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
        
        {familyMembers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No family members added</h3>
            <p className="text-gray-500 mb-4">Start by adding your family members to manage their health together.</p>
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-5 h-5" />
              Add First Family Member
            </button>
          </div>
        )}
      </div>

      {/* Common Family Health Insights */}
      {familyMembers.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Family Health Insights
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {familyInsights.commonAllergies?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Common Allergies</h4>
                <div className="space-y-1">
                  {familyInsights.commonAllergies.map((allergy: string, idx: number) => (
                    <span key={idx} className="inline-block bg-red-100 text-red-800 text-sm px-2 py-1 rounded mr-2">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {familyInsights.commonConditions?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Common Conditions</h4>
                <div className="space-y-1">
                  {familyInsights.commonConditions.map((condition: string, idx: number) => (
                    <span key={idx} className="inline-block bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded mr-2">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && <AddMemberForm />}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Relationship</p>
                  <p className="font-medium capitalize">{selectedMember.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{selectedMember.age} years</p>
                </div>
              </div>
              
              {selectedMember.chronicConditions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.chronicConditions.map((condition, idx) => (
                      <span key={idx} className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedMember.medications.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Current Medications</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.medications.map((medication, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                        {medication}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyHealthManagement;