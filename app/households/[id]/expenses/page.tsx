'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Share = {
    id: string
    amount: number
    settled: boolean
    user: { id: string; name: string }
}

type Expense = {
    id: string
    description: string
    amount: number
    createdAt: string
    paidBy: { id: string; name: string }
    shares: Share[]
}

export default function ExpensesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const householdId = params.id as string

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [newExpense, setNewExpense] = useState({ description: '', amount: '' })
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') fetchExpenses()
    }, [status, householdId])

    async function fetchExpenses() {
        const res = await fetch(`/api/households/${householdId}/expenses`)
        const data = await res.json()
        setExpenses(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    async function addExpense(e: React.FormEvent) {
        e.preventDefault()
        setAdding(true)
        setError('')

        const res = await fetch(`/api/households/${householdId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: newExpense.description,
                amount: parseFloat(newExpense.amount)
            })
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error)
            setAdding(false)
            return
        }

        setExpenses(prev => [data, ...prev])
        setNewExpense({ description: '', amount: '' })
        setShowForm(false)
        setAdding(false)
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                        {showForm ? 'Cancel' : '+ Add Expense'}
                    </button>
                </div>

                {/* Add Expense Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-4">New Expense</h2>
                        <form onSubmit={addExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    value={newExpense.description}
                                    onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="e.g. Electricity bill, Groceries"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button
                                type="submit"
                                disabled={adding}
                                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Expenses List */}
                {expenses.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-gray-500">No expenses yet.</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Add your first shared expense to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expenses.map(expense => (
                            <div key={expense.id} className="bg-white rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">{expense.description}</p>
                                        <p className="text-sm text-gray-500">
                                            Paid by {expense.paidBy.name} · {' '}
                                            {new Date(expense.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        ${expense.amount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 mb-1">Split equally</p>
                                    <div className="flex flex-wrap gap-2">
                                        {expense.shares.map(share => (
                                            <span
                                                key={share.id}
                                                className={`text-xs px-2 py-1 rounded-full ${share.settled
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {share.user.name}: ${share.amount.toFixed(2)}
                                                {share.settled ? ' ✓' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}