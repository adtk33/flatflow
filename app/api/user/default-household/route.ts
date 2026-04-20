import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { householdId } = await request.json()

    // Verify user is actually a member of this household
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

    await prisma.user.update({
      where: { id: session.user.id },
      data: { defaultHouseholdId: householdId }
    })

    return NextResponse.json({ message: 'Default household set' })
  } catch (err) {
    console.error('PATCH default household error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { defaultHouseholdId: null }
    })

    return NextResponse.json({ message: 'Default household cleared' })
  } catch (err) {
    console.error('DELETE default household error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}