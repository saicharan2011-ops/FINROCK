import { useEffect, useMemo, useState } from 'react'
import { createSession } from '../lib/backend.js'

const STORAGE_KEY = 'creditsense.session_id'

export function useSession(defaultCompany = 'Nexus Global', defaultLoan = 4200000) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(!sessionId)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function ensureSession() {
      if (sessionId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const created = await createSession({
          company_name: defaultCompany,
          loan_amount: defaultLoan,
        })
        if (cancelled) return
        localStorage.setItem(STORAGE_KEY, created.session_id)
        setSessionId(created.session_id)
      } catch (e) {
        if (cancelled) return
        setError(e?.message || 'Failed to create session')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    ensureSession()
    return () => {
      cancelled = true
    }
  }, [defaultCompany, defaultLoan, sessionId])

  const value = useMemo(() => ({ sessionId, loading, error }), [sessionId, loading, error])
  return value
}

