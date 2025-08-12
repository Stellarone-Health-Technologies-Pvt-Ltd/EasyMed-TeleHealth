# 🔥 Firebase Blaze Plan Setup & Deployment Guide
## EasyMed Pro - Advanced AI Healthcare Platform

This guide provides complete instructions for setting up and deploying the Firebase Blaze plan features that justify the enterprise-level investment for EasyMed Pro.

## 📋 Prerequisites

### Firebase Project Setup
1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Create new project
   firebase projects:create easymed-pro --display-name "EasyMed Pro"
   ```

2. **Upgrade to Blaze Plan**
   - Go to Firebase Console → Project Settings → Usage and Billing
   - Click "Modify Plan" → Select "Blaze Plan"
   - Set up billing account for pay-as-you-go pricing

### Required Firebase Services

#### 1. Firebase Authentication
```bash
# Enable authentication providers
firebase auth:enable --project easymed-pro
```

#### 2. Cloud Firestore
```bash
# Initialize Firestore
firebase firestore:init --project easymed-pro
```

#### 3. Realtime Database
```bash
# Create Realtime Database
firebase database:create --project easymed-pro --location us-central1
```

#### 4. Cloud Functions (Blaze Required)
```bash
# Initialize Cloud Functions
firebase functions:init --project easymed-pro --language typescript
```

#### 5. Cloud Storage
```bash
# Initialize Storage
firebase storage:init --project easymed-pro
```

#### 6. Firebase Analytics
```bash
# Enable Analytics
firebase analytics:enable --project easymed-pro
```

## 🔧 Environment Configuration

### 1. Create Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# Firebase Configuration (Blaze Plan)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=easymed-pro.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://easymed-pro-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=easymed-pro
VITE_FIREBASE_STORAGE_BUCKET=easymed-pro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI Configuration (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Azure Speech Services (for voice features)
AZURE_SPEECH_REGION=southcentralus
VITE_SPEECH_TOKEN_ENDPOINT=/api/azure-tts-token
AZURE_SPEECH_KEY=your_azure_speech_key

# ABHA Integration
VITE_ABHA_CLIENT_ID=your_abha_client_id
VITE_ABHA_CLIENT_SECRET=your_abha_client_secret
VITE_ABHA_BASE_URL=https://abhasbx.abdm.gov.in

# App Configuration
VITE_APP_NAME=EasyMedPro
VITE_EMERGENCY_NUMBER=108
VITE_ENVIRONMENT=production
```

### 2. Firebase Security Rules

#### Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family members - accessible by primary user
    match /familyMembers/{memberId} {
      allow read, write: if request.auth != null && 
        resource.data.primaryUserId == request.auth.uid;
    }
    
    // Health records - accessible by patient and authorized doctors
    match /healthRecords/{recordId} {
      allow read: if request.auth != null && (
        resource.data.patientId == request.auth.uid ||
        request.auth.token.role == 'doctor'
      );
      allow write: if request.auth != null && request.auth.token.role in ['doctor', 'asha'];
    }
    
    // Emergency alerts - readable by emergency contacts
    match /emergencyAlerts/{alertId} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications - user-specific
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.recipientId == request.auth.uid;
    }
  }
}
```

#### Realtime Database Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "wearableDevices": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "healthMetrics": {
      "$uid": {
        ".read": "$uid === auth.uid || auth.token.role === 'doctor'",
        ".write": "$uid === auth.uid || auth.token.role === 'doctor'"
      }
    },
    "monitoring": {
      "doctors": {
        "$doctorId": {
          ".read": "$doctorId === auth.uid && auth.token.role === 'doctor'",
          ".write": "$doctorId === auth.uid && auth.token.role === 'doctor'"
        }
      }
    },
    "voiceCommands": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "medicationReminders": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 🤖 Cloud Functions Setup

### 1. Initialize Functions
```bash
cd functions
npm install
```

### 2. Key Cloud Functions

#### AI Symptom Analysis Function
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

export const analyzeSymptoms = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { symptoms, patientHistory, demographics } = data;

  try {
    const prompt = `
    As a healthcare AI assistant, analyze these symptoms:
    Symptoms: ${symptoms}
    Patient Age: ${demographics?.age}
    Gender: ${demographics?.gender}
    Medical History: ${patientHistory?.join(', ')}
    
    Provide:
    1. Risk level (low/medium/high)
    2. Possible conditions
    3. Recommendations
    4. Urgency assessment
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    return {
      command: {
        intent: 'symptom_analysis',
        confidence: 0.95,
        parameters: { symptoms },
        language: 'en-US',
        originalText: symptoms
      },
      response: {
        text: response.choices[0]?.message?.content || 'Analysis unavailable',
        language: 'en-US',
        action: {
          type: 'analysis',
          parameters: { analysis: response.choices[0]?.message?.content }
        }
      }
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new functions.https.HttpsError('internal', 'Analysis failed');
  }
});

export const processVoiceCommand = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { text, language, context: userContext } = data;

  // Process voice command with AI
  const prompt = `
  Process this healthcare voice command: "${text}"
  Language: ${language}
  Context: ${JSON.stringify(userContext)}
  
  Return intent, confidence, and appropriate response.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    });

    // Parse AI response and return structured data
    return {
      command: {
        intent: 'ai_processed',
        confidence: 0.9,
        parameters: { query: text },
        language,
        originalText: text
      },
      response: {
        text: response.choices[0]?.message?.content || 'Command processed',
        language,
        action: {
          type: 'navigate',
          parameters: { target: 'ai-assistant' }
        }
      }
    };
  } catch (error) {
    console.error('Voice processing error:', error);
    return null; // Fallback to local processing
  }
});

export const generateHealthInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { patientId, analysisResult, patientData } = data;

  // Generate personalized health insights
  const insights = {
    id: Date.now().toString(),
    type: 'ai_insight',
    title: 'AI Health Recommendation',
    description: 'Based on your symptoms and health data, consider scheduling a consultation.',
    severity: analysisResult.riskLevel || 'medium',
    timestamp: new Date(),
    aiConfidence: 0.85
  };

  // Save to Firestore
  const admin = require('firebase-admin');
  await admin.firestore()
    .collection('healthInsights')
    .doc(patientId)
    .collection('insights')
    .add(insights);

  return { success: true };
});
```

### 3. Deploy Functions
```bash
# Set OpenAI API key
firebase functions:config:set openai.key="your_openai_api_key"

# Deploy functions
firebase deploy --only functions
```

## 🔐 Security & Compliance

### 1. HIPAA Compliance Setup
```typescript
// Encryption utilities
import * as crypto from 'crypto';

export class HealthDataEncryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('healthdata'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('healthdata'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. Audit Logging
```typescript
export const logHealthDataAccess = functions.firestore
  .document('healthRecords/{recordId}')
  .onRead(async (snap, context) => {
    const auditLog = {
      timestamp: new Date(),
      userId: context.auth?.uid,
      action: 'READ',
      resourceId: context.params.recordId,
      resourceType: 'healthRecord',
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent']
    };

    await admin.firestore().collection('auditLogs').add(auditLog);
  });
```

## 📱 Mobile App Deployment

### 1. PWA Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebaseapp\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache'
            }
          }
        ]
      },
      manifest: {
        name: 'EasyMed Pro',
        short_name: 'EasyMed',
        description: 'AI-Powered Healthcare Platform',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

### 2. Build and Deploy
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Firebase project created and upgraded to Blaze plan
- [ ] All environment variables configured
- [ ] Security rules implemented
- [ ] Cloud Functions deployed
- [ ] HIPAA compliance measures in place

### Production Deployment
- [ ] Domain configured: `https://easymed-pro.stellarone.health`
- [ ] SSL certificate installed
- [ ] CDN configured for global performance
- [ ] Monitoring and analytics enabled
- [ ] Backup and disaster recovery plan

### Post-deployment
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] User analytics dashboard
- [ ] Compliance audit scheduled
- [ ] Support system activated

## 📊 Performance Monitoring

### 1. Firebase Performance Monitoring
```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance();

// Custom traces for healthcare operations
export const traceHealthcareOperation = (operationName: string) => {
  const trace = perf.trace(operationName);
  trace.start();
  return trace;
};
```

### 2. Analytics Events
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// Track healthcare events
export const trackHealthEvent = (eventName: string, parameters: any) => {
  logEvent(analytics, eventName, {
    ...parameters,
    timestamp: new Date().toISOString()
  });
};
```

## 💰 Cost Optimization

### Firebase Blaze Plan Costs
- **Firestore**: $0.18 per 100K reads, $0.18 per 100K writes
- **Realtime Database**: $5 per GB/month
- **Cloud Functions**: $0.40 per million invocations
- **Storage**: $0.026 per GB/month
- **Hosting**: Free for first 10GB

### Estimated Monthly Costs
- **Small Scale** (1K users): $20-50
- **Medium Scale** (10K users): $100-300
- **Large Scale** (100K users): $500-1500

### Cost Optimization Strategies
1. **Firestore Query Optimization**: Use proper indexing
2. **Realtime Database**: Use for real-time features only
3. **Cloud Functions**: Optimize cold starts
4. **Storage**: Implement proper lifecycle policies
5. **Caching**: Use CDN and browser caching

## 🎯 Success Metrics

### Technical KPIs
- **App Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

### Business KPIs
- **User Engagement**: Daily active users
- **Healthcare Outcomes**: Patient satisfaction scores
- **Cost Savings**: Healthcare cost reduction
- **Revenue Growth**: Subscription and consultation fees

## 🔧 Troubleshooting

### Common Issues
1. **Firebase Connection Errors**: Check API keys and project configuration
2. **Permission Denied**: Verify security rules and user authentication
3. **Cloud Function Timeouts**: Optimize function performance
4. **Storage Quota Exceeded**: Implement data archiving

### Support Resources
- Firebase Console: https://console.firebase.google.com
- Firebase Documentation: https://firebase.google.com/docs
- EasyMed Support: support@stellarone.health

---

**This setup enables EasyMed Pro to fully utilize Firebase Blaze plan features, justifying the investment through enterprise-grade healthcare capabilities and positioning as India's leading AI healthcare platform.**