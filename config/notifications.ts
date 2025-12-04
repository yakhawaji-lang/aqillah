/**
 * Notifications Configuration
 * تكوين الإشعارات
 */

export const notificationsConfig = {
  // Firebase Cloud Messaging (FCM)
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || '',
    projectId: process.env.FCM_PROJECT_ID || '',
    enabled: !!process.env.FCM_SERVER_KEY,
  },
  
  // SMS Gateway
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio', // twilio, aws-sns, custom
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    fromNumber: process.env.SMS_FROM_NUMBER || '',
    enabled: !!process.env.SMS_API_KEY,
  },
  
  // Webhooks
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || '',
    timeout: 5000, // milliseconds
    retries: 3,
    enabled: true,
  },
  
  // Email (Optional)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, ses, smtp
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@aqillah.sa',
    enabled: !!process.env.EMAIL_API_KEY,
  },
  
  // Notification Channels Priority
  channels: {
    critical: ['push', 'sms', 'webhook'],
    high: ['push', 'webhook'],
    medium: ['push'],
    low: ['in_app'],
  },
  
  // Rate Limiting
  rateLimit: {
    push: {
      perUser: 10, // per minute
      perHour: 100,
    },
    sms: {
      perUser: 3, // per hour
      perDay: 10,
    },
  },
  
  // User Preferences Defaults
  defaultPreferences: {
    enabled: true,
    critical: true,
    high: true,
    medium: true,
    low: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '06:00',
    },
    drivingMode: {
      enabled: false,
      silent: false,
    },
  },
}

export type NotificationsConfig = typeof notificationsConfig

