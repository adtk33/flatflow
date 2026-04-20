import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { computeBalances, computeSettlements } from '@/lib/settlement'

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

    // Get all members for name lookup
    const memberships = await prisma.membership.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true } } }
    })

    const userMap: Record<string, string> = {}
    memberships.forEach(m => {
      userMap[m.user.id] = m.user.name
    })

    // Get all expenses with shares
    const expenses = await prisma.expense.findMany({
      where: { householdId },
      include: {
        shares: true
      }
    })

    const balances = computeBalances(expenses)
    const settlements = computeSettlements(balances)

    // Attach names to balances
    const balancesWithNames = Object.entries(balances).map(([userId, amount]) => ({
      userId,
      name: userMap[userId] || 'Unknown',
      amount: +amount.toFixed(2)
    }))

    // Attach names to settlements
    const settlementsWithNames = settlements.map(s => ({
      from: userMap[s.from] || 'Unknown',
      fromId: s.from,
      to: userMap[s.to] || 'Unknown',
      toId: s.to,
      amount: s.amount
    }))

    return NextResponse.json({
      balances: balancesWithNames,
      settlements: settlementsWithNames
    })
  } catch (err) {
    console.error('GET balances error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}