import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  console.log('SESSION:', session)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          memberships: {
            include: { user: true }
          }
        }
      }
    }
  })

  const households = memberships.map(m => ({
    ...m.household,
    role: m.role
  }))

  return NextResponse.json(households)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const household = await prisma.household.create({
    data: {
      name,
      memberships: {
        create: {
          userId: session.user.id,
          role: 'owner'
        }
      }
    },
    include: {
      memberships: {
        include: { user: true }
      }
    }
  })

  await prisma.activity.create({
    data: {
      householdId: household.id,
      userId: session.user.id,
      type: 'household_created',
      description: `${session.user.name} created the household`
    }
  })

  return NextResponse.json(household, { status: 201 })
}