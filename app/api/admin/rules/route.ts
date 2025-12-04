import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: rules,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, conditions, actions, priority } = body

    const rule = await prisma.alertRule.create({
      data: {
        name,
        description,
        conditions: conditions || [],
        actions: actions || {},
        priority: priority || 'medium',
        enabled: true,
        active: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: rule,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    )
  }
}

