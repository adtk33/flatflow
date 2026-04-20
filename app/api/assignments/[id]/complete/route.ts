import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        chore: {
          include: { household: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify user is a member of this household
    const membership = await prisma.membership.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId: assignment.chore.householdId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: 'done' }
    })

    await prisma.activity.create({
      data: {
        householdId: assignment.chore.householdId,
        userId: session.user.id,
        type: 'chore_complete',
        description: `${session.user.name} completed "${assignment.chore.name}"`
      }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH assignment error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}