import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: householdId } = await params

    const membership = await prisma.membership.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activities = await prisma.activity.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json(activities)
  } catch (err) {
    console.error('GET activities error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}