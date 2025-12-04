/**
 * Notification Service
 * خدمة الإشعارات (Push, SMS, Webhook, Email)
 */

import { notificationsConfig } from '@/config/notifications'
import { prisma } from '@/lib/prisma'

export interface NotificationRequest {
  userId?: string
  type: 'push' | 'sms' | 'email' | 'webhook' | 'in_app'
  category: 'alert' | 'warning' | 'info' | 'critical'
  title: string
  message: string
  data?: Record<string, any>
  alertId?: string
  routeId?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  error?: string
  channel?: string
}

class NotificationService {
  /**
   * Send notification
   */
  async sendNotification(
    request: NotificationRequest
  ): Promise<NotificationResult> {
    try {
      // Check user preferences if userId provided
      if (request.userId) {
        const canSend = await this.checkUserPreferences(
          request.userId,
          request.category
        )
        if (!canSend) {
          return {
            success: false,
            error: 'User has disabled this notification type',
          }
        }
      }

      // Determine channels based on priority
      const channels = this.getChannels(request.priority || request.category)

      const results: NotificationResult[] = []

      // Send to each channel
      for (const channel of channels) {
        if (channel === 'push' && notificationsConfig.fcm.enabled) {
          const result = await this.sendPushNotification(request)
          results.push({ ...result, channel: 'push' })
        }

        if (channel === 'sms' && notificationsConfig.sms.enabled) {
          const result = await this.sendSMS(request)
          results.push({ ...result, channel: 'sms' })
        }

        if (channel === 'webhook' && notificationsConfig.webhooks.enabled) {
          const result = await this.sendWebhook(request)
          results.push({ ...result, channel: 'webhook' })
        }

        if (channel === 'email' && notificationsConfig.email.enabled) {
          const result = await this.sendEmail(request)
          results.push({ ...result, channel: 'email' })
        }

        if (channel === 'in_app') {
          const result = await this.saveInAppNotification(request)
          results.push({ ...result, channel: 'in_app' })
        }
      }

      // Return first successful result or first error
      const successResult = results.find((r) => r.success)
      if (successResult) return successResult

      return results[0] || { success: false, error: 'No channels available' }
    } catch (error: any) {
      console.error('Error sending notification:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send push notification via FCM
   */
  private async sendPushNotification(
    request: NotificationRequest
  ): Promise<NotificationResult> {
    if (!notificationsConfig.fcm.enabled) {
      return { success: false, error: 'FCM not enabled' }
    }

    try {
      // TODO: Implement FCM push notification
      // This requires FCM server key and device tokens
      
      // Placeholder implementation
      console.log('Sending push notification:', request.title)
      
      return {
        success: true,
        notificationId: `push_${Date.now()}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send SMS
   */
  private async sendSMS(request: NotificationRequest): Promise<NotificationResult> {
    if (!notificationsConfig.sms.enabled) {
      return { success: false, error: 'SMS not enabled' }
    }

    try {
      // TODO: Implement SMS sending via configured provider
      console.log('Sending SMS:', request.message)
      
      return {
        success: true,
        notificationId: `sms_${Date.now()}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send webhook
   */
  private async sendWebhook(request: NotificationRequest): Promise<NotificationResult> {
    if (!notificationsConfig.webhooks.enabled) {
      return { success: false, error: 'Webhooks not enabled' }
    }

    try {
      // TODO: Implement webhook sending
      // This requires webhook URLs from admin configuration
      console.log('Sending webhook:', request.title)
      
      return {
        success: true,
        notificationId: `webhook_${Date.now()}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send email
   */
  private async sendEmail(request: NotificationRequest): Promise<NotificationResult> {
    if (!notificationsConfig.email.enabled) {
      return { success: false, error: 'Email not enabled' }
    }

    try {
      // TODO: Implement email sending
      console.log('Sending email:', request.title)
      
      return {
        success: true,
        notificationId: `email_${Date.now()}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Save in-app notification
   */
  private async saveInAppNotification(
    request: NotificationRequest
  ): Promise<NotificationResult> {
    if (!request.userId) {
      return { success: false, error: 'User ID required for in-app notification' }
    }

    try {
      const notification = await prisma.userNotification.create({
        data: {
          userId: request.userId,
          type: request.type,
          category: request.category,
          title: request.title,
          message: request.message,
          data: request.data || {},
          alertId: request.alertId,
          routeId: request.routeId,
          sent: true,
          sentAt: new Date(),
        },
      })

      return {
        success: true,
        notificationId: notification.id,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get channels based on priority
   */
  private getChannels(
    priority: 'low' | 'medium' | 'high' | 'critical' | 'alert' | 'warning' | 'info'
  ): string[] {
    const priorityMap: Record<string, string> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      alert: 'high',
      warning: 'medium',
      info: 'low',
    }

    const mappedPriority = priorityMap[priority] || 'medium'
    return notificationsConfig.channels[mappedPriority as keyof typeof notificationsConfig.channels] || ['push']
  }

  /**
   * Check user preferences
   */
  private async checkUserPreferences(
    userId: string,
    category: string
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      })

      if (!user || !user.settings) {
        return true // Default: allow notifications
      }

      const settings = user.settings as any
      const preferences = settings.notifications || notificationsConfig.defaultPreferences

      // Check if notifications are enabled
      if (!preferences.enabled) {
        return false
      }

      // Check category preference
      const categoryEnabled = preferences[category] !== false
      if (!categoryEnabled) {
        return false
      }

      // Check quiet hours
      if (preferences.quietHours?.enabled) {
        const now = new Date()
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const start = preferences.quietHours.start
        const end = preferences.quietHours.end

        if (this.isInQuietHours(currentTime, start, end) && category !== 'critical') {
          return false
        }
      }

      // Check driving mode
      if (preferences.drivingMode?.enabled && preferences.drivingMode?.silent) {
        if (category !== 'critical') {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error checking user preferences:', error)
      return true // Default: allow on error
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime: string, start: string, end: string): boolean {
    const [currentHour, currentMin] = currentTime.split(':').map(Number)
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)

    const current = currentHour * 60 + currentMin
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      return current >= startTime && current <= endTime
    } else {
      // Crosses midnight
      return current >= startTime || current <= endTime
    }
  }
}

export const notificationService = new NotificationService()

