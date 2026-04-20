'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Household = {
    id: string
    name: string
    inviteCode: string
    role: string
    memberships: { user: { name: string }; role: string }[]
}

function DashboardContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [households, setHouseholds] = useState<Household[]>([])
    const [defaultId, setDefaultId] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({})
    const [inviteSent, setInviteSent] = useState<Record<string, boolean>>({})
    const [inviteError, setInviteError] = useState<Record<string, string>>({})
    const [sendingInvite, setSendingInvite] = useState<Record<string, boolean>>({})
    const searchParams = useSearchParams()

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            Promise.all([
                fetch('/api/households').then(r => r.json()),
                fetch('/api/user/me').then(r => r.json())
            ]).then(([householdsData, userData]) => {
                const list = Array.isArray(householdsData) ? householdsData : []
                setHouseholds(list)

                if (userData.defaultHouseholdId) {
                    setDefaultId(userData.defaultHouseholdId)

                    // Only redirect if not already on dashboard intentionally
                    const skipRedirect = searchParams.get('showAll') === 'true'

                    if (!skipRedirect) {
                        router.push(`/households/${userData.defaultHouseholdId}`)
                        return
                    }
                }

                setLoading(false)
            })
        } else if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router, searchParams])

    async function createHousehold(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)

        const res = await fetch('/api/households', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })

        const data = await res.json()
        const refreshed = await fetch('/api/households').then(r => r.json())
        setHouseholds(Array.isArray(refreshed) ? refreshed : [])
        setNewName('')
        setCreating(false)
    }

    async function setDefault(householdId: string) {
        await fetch('/api/user/default-household', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId })
        })
        setDefaultId(householdId)
        router.push(`/households/${householdId}`)
    }

    async function clearDefault() {
        await fetch('/api/user/default-household', { method: 'DELETE' })
        setDefaultId(null)
        setLoading(false)
    }

    function copyInvite(inviteCode: string) {
        const link = `${window.location.origin}/join/${inviteCode}`
        navigator.clipboard.writeText(link)
        setCopied(inviteCode)
        setTimeout(() => setCopied(null), 2000)
    }

    async function sendEmailInvite(householdId: string) {
        const email = inviteEmail[householdId]
        if (!email) return

        setSendingInvite(prev => ({ ...prev, [householdId]: true }))
        setInviteError(prev => ({ ...prev, [householdId]: '' }))

        const res = await fetch(`/api/households/${householdId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })

        const data = await res.json()

        if (!res.ok) {
            setInviteError(prev => ({ ...prev, [householdId]: data.error }))
        } else {
            setInviteSent(prev => ({ ...prev, [householdId]: true }))
            setInviteEmail(prev => ({ ...prev, [householdId]: '' }))
            setTimeout(() => {
                setInviteSent(prev => ({ ...prev, [householdId]: false }))
            }, 3000)
        }

        setSendingInvite(prev => ({ ...prev, [householdId]: false }))
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">FlatFlow</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Hi, {session?.user?.name}</span>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Create Household */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Create a Household
                    </h2>
                    <form onSubmit={createHousehold} className="flex gap-2">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. The Flat, 42 Brook St"
                            required
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={creating}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </form>
                </div>

                {/* Households List */}
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Your Households
                </h2>

                {households.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-gray-500">No households yet.</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Create one above or ask a roommate for an invite link.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {households.map(h => (
                            <div key={h.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{h.name}</h3>
                                            {defaultId === h.id && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 capitalize">{h.role}</p>
                                    </div>
                                    <button
                                        onClick={() => copyInvite(h.inviteCode)}
                                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-gray-800 font-medium"
                                    >
                                        {copied === h.inviteCode ? '✓ Copied!' : 'Copy Invite Link'}
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 mb-4">
                                    {h.memberships?.length ?? 0} member{(h.memberships?.length ?? 0) !== 1 ? 's' : ''}: {' '}
                                    {h.memberships?.map(m => m.user.name).join(', ') ?? ''}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Link
                                        href={`/households/${h.id}`}
                                        className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-md"
                                    >
                                        Open
                                    </Link>
                                    <Link
                                        href={`/households/${h.id}/chores`}
                                        className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md"
                                    >
                                        Chores
                                    </Link>
                                    <Link
                                        href={`/households/${h.id}/expenses`}
                                        className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md"
                                    >
                                        Expenses
                                    </Link>
                                    <Link
                                        href={`/households/${h.id}/balances`}
                                        className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md"
                                    >
                                        Balances
                                    </Link>
                                    {defaultId === h.id ? (
                                        <button
                                            onClick={clearDefault}
                                            className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded-md"
                                        >
                                            Clear Default
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setDefault(h.id)}
                                            className="text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-md"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                </div>

                                {/* Invite by email */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Invite by email
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={inviteEmail[h.id] || ''}
                                            onChange={e => setInviteEmail(prev => ({
                                                ...prev,
                                                [h.id]: e.target.value
                                            }))}
                                            placeholder="roommate@email.com"
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                                        />
                                        <button
                                            onClick={() => sendEmailInvite(h.id)}
                                            disabled={sendingInvite[h.id] || !inviteEmail[h.id]}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {sendingInvite[h.id]
                                                ? 'Sending...'
                                                : inviteSent[h.id]
                                                    ? '✓ Sent!'
                                                    : 'Send'}
                                        </button>
                                    </div>
                                    {inviteError[h.id] && (
                                        <p className="text-red-500 text-xs mt-1">{inviteError[h.id]}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}