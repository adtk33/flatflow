'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Household = {
    id: string
    name: string
    inviteCode: string
    role: string
    memberships: { user: { name: string }; role: string }[]
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [households, setHouseholds] = useState<Household[]>([])
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)


    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/households')
                .then(r => r.json())
                .then(data => {
                    setHouseholds(Array.isArray(data) ? data : [])
                    setLoading(false)
                })
        } else if (status === 'unauthenticated') {
            router.push('/login')
        }
        // if status === 'loading' we just wait
    }, [status, router])

    async function createHousehold(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)

        const res = await fetch('/api/households', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })

        const data = await res.json()
        setHouseholds(prev => [...prev, { ...data, role: 'owner' }])
        setNewName('')
        setCreating(false)
    }

    function copyInvite(inviteCode: string) {
        const link = `${window.location.origin}/join/${inviteCode}`
        console.log('INVITE LINK:', link)
        navigator.clipboard.writeText(link)
        setCopied(inviteCode)
        setTimeout(() => setCopied(null), 2000)
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
            {/* Nav */}
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
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        <h3 className="font-semibold text-gray-900">{h.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{h.role}</p>
                                    </div>
                                    <button
                                        onClick={() => copyInvite(h.inviteCode)}
                                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
                                    >
                                        {copied === h.inviteCode ? '✓ Copied!' : 'Copy Invite Link'}
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 mb-4">
                                    {h.memberships.length} member{h.memberships.length !== 1 ? 's' : ''}: {' '}
                                    {h.memberships.map(m => m.user.name).join(', ')}
                                </p>

                                <div className="flex gap-2">
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}