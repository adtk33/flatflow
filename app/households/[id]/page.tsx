'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'


type Assignment = {
    id: string
    dueDate: string
    status: string
    chore: { name: string }
}

type Summary = {
    householdName: string
    assignments: Assignment[]
    myBalance: number
}

export default function HouseholdHomePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const householdId = params.id as string

    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState<{
        id: string
        type: string
        description: string
        createdAt: string
    }[]>([])

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            Promise.all([
                fetch(`/api/households/${householdId}/summary`).then(r => r.json()),
                fetch(`/api/households/${householdId}/activities`).then(r => r.json())
            ]).then(([summaryData, activityData]) => {
                setSummary(summaryData)
                setActivities(Array.isArray(activityData) ? activityData : [])
                setLoading(false)
            })
        }
    }, [status, householdId])

    function formatDate(dateString: string) {
        const date = new Date(dateString)
        const today = new Date()
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)

        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    if (loading) {
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
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {session?.user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">{summary?.householdName}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Your Chores */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-900">Your Chores</h2>
                            <Link
                                href={`/households/${householdId}/chores`}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                View all →
                            </Link>
                        </div>

                        {summary?.assignments.length === 0 ? (
                            <p className="text-sm text-gray-400">No upcoming chores 🎉</p>
                        ) : (
                            <div className="space-y-3">
                                {summary?.assignments.map(a => (
                                    <div key={a.id} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">{a.chore.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${formatDate(a.dueDate) === 'Today'
                                            ? 'bg-red-100 text-red-700'
                                            : formatDate(a.dueDate) === 'Tomorrow'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {formatDate(a.dueDate)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Your Balance */}
                    <div className={`rounded-lg shadow-sm p-6 ${(summary?.myBalance ?? 0) > 0
                        ? 'bg-green-50 border border-green-200'
                        : (summary?.myBalance ?? 0) < 0
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-white'
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-900">Your Balance</h2>
                            <Link
                                href={`/households/${householdId}/balances`}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                View all →
                            </Link>
                        </div>

                        <p className={`text-3xl font-bold ${(summary?.myBalance ?? 0) > 0
                            ? 'text-green-600'
                            : (summary?.myBalance ?? 0) < 0
                                ? 'text-red-600'
                                : 'text-gray-500'
                            }`}>
                            {(summary?.myBalance ?? 0) > 0
                                ? `+$${summary?.myBalance.toFixed(2)}`
                                : (summary?.myBalance ?? 0) < 0
                                    ? `-$${Math.abs(summary?.myBalance ?? 0).toFixed(2)}`
                                    : '$0.00'}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                            {(summary?.myBalance ?? 0) > 0
                                ? 'You are owed money'
                                : (summary?.myBalance ?? 0) < 0
                                    ? 'You owe money'
                                    : 'All settled up'}
                        </p>

                        {(summary?.myBalance ?? 0) < 0 && (
                            <Link
                                href={`/households/${householdId}/balances`}
                                className="inline-block mt-4 bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Settle Up →
                            </Link>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    <Link
                        href={`/households/${householdId}/chores`}
                        className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">🧹</p>
                        <p className="text-sm font-medium text-gray-700">Chores</p>
                    </Link>
                    <Link
                        href={`/households/${householdId}/expenses`}
                        className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">💸</p>
                        <p className="text-sm font-medium text-gray-700">Expenses</p>
                    </Link>
                    <Link
                        href={`/households/${householdId}/calendar`}
                        className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">📅</p>
                        <p className="text-sm font-medium text-gray-700">Calendar</p>
                    </Link>
                </div>
                {/* Activity Feed */}
                {activities.length > 0 && (
                    <div className="mt-6">
                        <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
                        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
                            {activities.map(activity => (
                                <div key={activity.id} className="px-4 py-3 flex justify-between items-center">
                                    <p className="text-sm text-gray-700">{activity.description}</p>
                                    <p className="text-xs text-gray-400 ml-4 shrink-0">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}