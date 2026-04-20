'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Assignment = {
  id: string
  dueDate: string
  status: string
  user: { id: string; name: string }
}

type Chore = {
  id: string
  name: string
  frequency: string
  assignments: Assignment[]
}

export default function ChoresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const householdId = params.id as string

  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newChore, setNewChore] = useState({ name: '', frequency: 'weekly' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChores()
    }
  }, [status, householdId])

  async function fetchChores() {
    const res = await fetch(`/api/households/${householdId}/chores`)
    const data = await res.json()
    setChores(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function addChore(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')

    const res = await fetch(`/api/households/${householdId}/chores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChore)
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setAdding(false)
      return
    }

    setChores(prev => [...prev, data])
    setNewChore({ name: '', frequency: 'weekly' })
    setShowForm(false)
    setAdding(false)
  }

  async function markDone(assignmentId: string) {
    const res = await fetch(`/api/assignments/${assignmentId}/complete`, {
      method: 'PATCH'
    })

    if (res.ok) {
      setChores(prev =>
        prev.map(chore => ({
          ...chore,
          assignments: chore.assignments.map(a =>
            a.id === assignmentId ? { ...a, status: 'done' } : a
          )
        }))
      )
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            {showForm ? 'Cancel' : '+ Add Chore'}
          </button>
        </div>

        {/* Add Chore Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">New Chore</h2>
            <form onSubmit={addChore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chore Name
                </label>
                <input
                  value={newChore.name}
                  onChange={e => setNewChore(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Take out trash, Clean bathroom"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newChore.frequency}
                  onChange={e => setNewChore(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Chore'}
              </button>
            </form>
          </div>
        )}

        {/* Chores List */}
        {chores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No chores yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Add your first chore to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chores.map(chore => (
              <div key={chore.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{chore.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{chore.frequency}</p>
                  </div>
                </div>

                {/* Upcoming Assignments */}
                <div className="space-y-2">
                  {chore.assignments.length === 0 ? (
                    <p className="text-sm text-gray-400">No upcoming assignments</p>
                  ) : (
                    chore.assignments.slice(0, 4).map(assignment => (
                      <div
                        key={assignment.id}
                        className={`flex justify-between items-center p-2 rounded-md ${assignment.status === 'done'
                            ? 'bg-green-50'
                            : 'bg-gray-50'
                          }`}
                      >
                        <div>
                          <span className={`text-sm ${assignment.status === 'done'
                              ? 'line-through text-gray-400'
                              : 'text-gray-700'
                            }`}>
                            {assignment.user.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>

                        {assignment.status === 'done' ? (
                          <span className="text-xs text-green-600 font-medium">✓ Done</span>
                        ) : (
                          assignment.user.id === session?.user?.id && (
                            <button
                              onClick={() => markDone(assignment.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Mark Done
                            </button>
                          )
                        )}
                      </div>
                    ))
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