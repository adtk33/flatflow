import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        defaultHouseholdId: true
      }
    })

    return NextResponse.json(user)
  } catch (err) {
    console.error('GET user me error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}