/**
 * Notifications API - إرسال إشعارات
 */

import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notifications'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      type,
      category,
      title,
      message,
      data,
      alertId,
      routeId,
      priority,
    } = body

    // Validate input
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Send notification
    const result = await notificationService.sendNotification({
      userId,
      type: type || 'push',
      category: category || 'info',
      title,
      message,
      data,
      alertId,
      routeId,
      priority,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationId: result.notificationId,
        channel: result.channel,
      },
    })
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}

/**
 * Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
        ...(read !== null && { read: read === 'true' }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: notifications,
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

