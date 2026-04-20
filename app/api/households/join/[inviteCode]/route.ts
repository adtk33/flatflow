import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const inviteCode = pathParts[pathParts.length - 1]

    if (!inviteCode) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 })
    }

    const household = await prisma.household.findUnique({
      where: { inviteCode }
    })

    if (!household) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    const existing = await prisma.membership.findUnique({
      where: {
        userId_householdId: {
          userId: session.user.id,
          householdId: household.id
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    await prisma.membership.create({
      data: {
        userId: session.user.id,
        householdId: household.id,
        role: 'member'
      }
    })

    await prisma.activity.create({
      data: {
        householdId: household.id,
        userId: session.user.id,
        type: 'member_joined',
        description: `${session.user.name} joined the household`
      }
    })

    return NextResponse.json({ householdId: household.id })

  } catch (err) {
    console.error('JOIN error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}