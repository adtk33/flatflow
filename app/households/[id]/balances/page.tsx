'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Balance = {
    userId: string
    name: string
    amount: number
}

type Settlement = {
    from: string
    fromId: string
    to: string
    toId: string
    amount: number
}

export default function BalancesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const householdId = params.id as string

    const [balances, setBalances] = useState<Balance[]>([])
    const [settlements, setSettlements] = useState<Settlement[]>([])
    const [loading, setLoading] = useState(true)
    const [settling, setSettling] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') fetchBalances()
    }, [status, householdId])

    async function fetchBalances() {
        const res = await fetch(`/api/households/${householdId}/balances`)
        const data = await res.json()
        setBalances(data.balances || [])
        setSettlements(data.settlements || [])
        setLoading(false)
    }

    async function handleSettle() {
        setSettling(true)

        const res = await fetch(`/api/households/${householdId}/settle`, {
            method: 'POST'
        })

        if (res.ok) {
            await fetchBalances()
        }

        setSettling(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    const myBalance = balances.find(b => b.userId === session?.user?.id)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <Link href={`/households/${householdId}`} className="text-xl font-bold text-blue-600">
                    FlatFlow
                </Link>
                <div className="flex items-center gap-4 text-sm">
                    <Link href={`/households/${householdId}/chores`} className="text-gray-500 hover:text-gray-700">
                        Chores
                    </Link>
                    <Link href={`/households/${householdId}/expenses`} className="text-gray-500 hover:text-gray-700">
                        Expenses
                    </Link>
                    <Link href={`/households/${householdId}/balances`} className="text-gray-500 hover:text-gray-700">
                        Balances
                    </Link>
                    <Link href={`/households/${householdId}/calendar`} className="text-gray-500 hover:text-gray-700">
                        Calendar
                    </Link>
                    <Link href="/dashboard?showAll=true" className="text-gray-500 hover:text-gray-700">
                        Households
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Balances</h1>

                {/* My Balance Summary */}
                {myBalance && (
                    <div className={`rounded-lg p-6 mb-6 ${myBalance.amount > 0
                            ? 'bg-green-50 border border-green-200'
                            : myBalance.amount < 0
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-gray-50 border border-gray-200'
                        }`}>
                        <p className="text-sm font-medium text-gray-600 mb-1">Your balance</p>
                        <p className={`text-3xl font-bold ${myBalance.amount > 0
                                ? 'text-green-600'
                                : myBalance.amount < 0
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                            }`}>
                            {myBalance.amount > 0
                                ? `+$${myBalance.amount.toFixed(2)}`
                                : myBalance.amount < 0
                                    ? `-$${Math.abs(myBalance.amount).toFixed(2)}`
                                    : 'All settled up'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {myBalance.amount > 0
                                ? 'You are owed money'
                                : myBalance.amount < 0
                                    ? 'You owe money'
                                    : 'Nothing owed'}
                        </p>
                    </div>
                )}

                {/* All Balances */}
                {balances.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
                        <p className="text-gray-500">No balances yet.</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Add expenses to see who owes what.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Everyone's Balance</h2>
                        <div className="space-y-3">
                            {balances.map(balance => (
                                <div key={balance.userId} className="flex justify-between items-center">
                                    <span className="text-gray-700">{balance.name}</span>
                                    <span className={`font-semibold ${balance.amount > 0
                                            ? 'text-green-600'
                                            : balance.amount < 0
                                                ? 'text-red-600'
                                                : 'text-gray-500'
                                        }`}>
                                        {balance.amount > 0
                                            ? `+$${balance.amount.toFixed(2)}`
                                            : balance.amount < 0
                                                ? `-$${Math.abs(balance.amount).toFixed(2)}`
                                                : 'Settled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settle Up Plan */}
                {settlements.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Settle Up</h2>
                        <div className="space-y-3">
                            {settlements.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">{s.from}</span>
                                        {' '}pays{' '}
                                        <span className="font-medium">{s.to}</span>
                                    </p>
                                    <span className="font-semibold text-gray-900">
                                        ${s.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mark as Settled Button */}
                {myBalance && myBalance.amount < 0 && (
                    <button
                        onClick={handleSettle}
                        disabled={settling}
                        className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        {settling ? 'Marking as settled...' : 'Mark My Balance as Settled'}
                    </button>
                )}
            </main>
        </div>
    )
}