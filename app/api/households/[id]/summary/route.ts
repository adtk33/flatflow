import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { computeBalances } from '@/lib/settlement'

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

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { name: true }
    })

    // Get user's upcoming assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        userId: session.user.id,
        chore: { householdId },
        dueDate: { gte: new Date() },
        status: 'pending'
      },
      include: {
        chore: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    // Get balance
    const expenses = await prisma.expense.findMany({
      where: { householdId },
      include: { shares: true }
    })

    const balances = computeBalances(expenses)
    const myBalance = balances[session.user.id] ?? 0

    return NextResponse.json({
      householdName: household?.name,
      assignments,
      myBalance: +myBalance.toFixed(2)
    })
  } catch (err) {
    console.error('GET summary error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}