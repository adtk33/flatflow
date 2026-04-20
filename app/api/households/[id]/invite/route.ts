import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/email'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: householdId } = await params
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Verify sender is a member
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
            where: { id: householdId }
        })

        if (!household) {
            return NextResponse.json({ error: 'Household not found' }, { status: 404 })
        }

        const result = await sendInviteEmail(
            email,
            session.user.name ?? 'Your roommate',
            household.name,
            household.inviteCode
        )
        console.log('INVITE - email result:', result)
        if (!result.success) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        await prisma.activity.create({
            data: {
                householdId,
                userId: session.user.id,
                type: 'invite_sent',
                description: `${session.user.name} sent an invite to ${email}`
            }
        })

        return NextResponse.json({ message: 'Invite sent' })
    } catch (err) {
        console.error('POST invite error:', err)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
}