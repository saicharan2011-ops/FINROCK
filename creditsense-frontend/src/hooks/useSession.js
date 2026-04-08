import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSession, getSession } from '../lib/backend.js'

const STORAGE_KEY = 'creditsense.session_id'

export function useSession(defaultCompany = 'Nexus Global', defaultLoan = 4200000) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(!sessionId)
  const [error, setError] = useState('')
  const initializedRef = useRef(false)

  const createFreshSession = useCallback(async () => {
    const created = await createSession({
      company_name: defaultCompany,
      loan_amount: defaultLoan,
    })
    localStorage.setItem(STORAGE_KEY, created.session_id)
    setSessionId(created.session_id)
    return created.session_id
  }, [defaultCompany, defaultLoan])

  const refreshSession = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await createFreshSession()
    } catch (e) {
      setError(e?.message || 'Failed to refresh session')
    } finally {
      setLoading(false)
    }
  }, [createFreshSession])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let cancelled = false

    async function ensureSession() {
      setLoading(true)
      setError('')
      try {
        const stored = localStorage.getItem(STORAGE_KEY) || ''
        if (stored) {
          try {
            await getSession(stored)
            if (!cancelled) setSessionId(stored)
          } catch {
            if (cancelled) return
            const fresh = await createSession({
              company_name: defaultCompany,
              loan_amount: defaultLoan,
            })
            if (cancelled) return
            localStorage.setItem(STORAGE_KEY, fresh.session_id)
            setSessionId(fresh.session_id)
          }
        } else {
          if (cancelled) return
          const fresh = await createSession({
            company_name: defaultCompany,
            loan_amount: defaultLoan,
          })
          if (cancelled) return
          localStorage.setItem(STORAGE_KEY, fresh.session_id)
          setSessionId(fresh.session_id)
        }
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
  }, [defaultCompany, defaultLoan])

  const value = useMemo(
    () => ({ sessionId, loading, error, refreshSession }),
    [sessionId, loading, error, refreshSession],
  )
  return value
}

