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

    const expenses = await prisma.expense.findMany({
      where: { householdId },
      include: {
        paidBy: { select: { id: true, name: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(expenses)
  } catch (err) {
    console.error('GET expenses error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: householdId } = await params
    const { description, amount } = await request.json()

    if (!description || !amount) {
      return NextResponse.json({ error: 'Description and amount are required' }, { status: 400 })
    }

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

    // Get all household members for equal split
    const memberships = await prisma.membership.findMany({
      where: { householdId },
      select: { userId: true }
    })

    const memberIds = memberships.map(m => m.userId)
    const shareAmount = +(amount / memberIds.length).toFixed(2)

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: +amount,
        paidById: session.user.id,
        householdId,
        shares: {
          create: memberIds.map(userId => ({
            userId,
            amount: shareAmount,
            settled: userId === session.user.id
          }))
        }
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })

    await prisma.activity.create({
      data: {
        householdId,
        userId: session.user.id,
        type: 'expense_added',
        description: `${session.user.name} added expense "${description}" ($${amount})`
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (err) {
    console.error('POST expense error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}