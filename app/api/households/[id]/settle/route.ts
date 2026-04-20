import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // Mark all unsettled shares for this user as settled
    await prisma.expenseShare.updateMany({
      where: {
        userId: session.user.id,
        settled: false,
        expense: { householdId }
      },
      data: { settled: true }
    })

    await prisma.activity.create({
      data: {
        householdId,
        userId: session.user.id,
        type: 'settled',
        description: `${session.user.name} marked their balance as settled`
      }
    })

    return NextResponse.json({ message: 'Settled' })
  } catch (err) {
    console.error('POST settle error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}