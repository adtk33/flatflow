'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/join/${params.inviteCode}`)
    }
  }, [status, router, params.inviteCode])

  async function handleJoin() {
    setLoading(true)
    setError('')
    console.log('PARAMS:', params)  // ← add this
    console.log('INVITE CODE:', params.inviteCode)
    
    try {
      const res = await fetch(`/api/households/join/${params.inviteCode}`, {
        method: 'POST'
      })

      const data = await res.json()
      console.log('JOIN RESPONSE:', res.status, data)

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('JOIN ERROR:', err)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You've been invited!
        </h1>
        <p className="text-gray-600 mb-2">
          Signed in as <span className="font-medium">{session?.user?.name}</span>
        </p>
        <p className="text-gray-600 mb-6">
          Click below to join this household on FlatFlow.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Household'}
        </button>
      </div>
    </div>
  )
}