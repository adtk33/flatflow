import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateAssignments } from '@/lib/choreRotation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: householdId } = await params

    // Verify membership
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

    const chores = await prisma.chore.findMany({
      where: { householdId },
      include: {
        assignments: {
          where: {
            dueDate: {
              gte: new Date()
            }
          },
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(chores)
  } catch (err) {
    console.error('GET chores error:', err)
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
    const { name, frequency } = await request.json()

    if (!name || !frequency) {
      return NextResponse.json({ error: 'Name and frequency are required' }, { status: 400 })
    }

    // Verify membership
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

    // Get all household members
    const memberships = await prisma.membership.findMany({
      where: { householdId },
      select: { userId: true }
    })

    const memberIds = memberships.map(m => m.userId)

    // Create chore
    const chore = await prisma.chore.create({
      data: { name, frequency, householdId }
    })

    // Generate assignments using rotation logic
    const assignmentData = generateAssignments(memberIds, chore.id, frequency)

    await prisma.assignment.createMany({
      data: assignmentData
    })

    // Log activity
    await prisma.activity.create({
      data: {
        householdId,
        userId: session.user.id,
        type: 'chore_created',
        description: `${session.user.name} added chore "${name}"`
      }
    })

    // Return chore with assignments
    const choreWithAssignments = await prisma.chore.findUnique({
      where: { id: chore.id },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    })

    return NextResponse.json(choreWithAssignments, { status: 201 })
  } catch (err) {
    console.error('POST chore error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}