import { useCallback, useEffect, useRef, useState } from 'react'
import { getResults, wsUrlCandidates } from '../lib/backend.js'

export const useAnalysis = (sessionId) => {
  const [logs, setLogs] = useState([])
  const [socketState, setSocketState] = useState('idle')
  const [socketError, setSocketError] = useState('')
  const [metrics, setMetrics] = useState({
    completionScore: 0,
    integrity: 0,
    transparency: 0,
    ratios: {
      revenue: '$0',
      ebitda: '$0',
      debtEquity: '0',
    },
    gauges: {
      circular: 0,
      shell: 0,
      lien: 0,
      pep: 0,
    },
    insight: '',
  })
  const socketRef = useRef(null)
  const pendingStartRef = useRef(false)
  const hasOpenedRef = useRef(false)
  const resultSyncTimerRef = useRef(null)

  const syncFinalResults = useCallback(async () => {
    if (!sessionId) return
    try {
      const result = await getResults(sessionId)
      if (!result) return
      setMetrics((prev) => ({
        ...prev,
        completionScore: result.completionScore ?? prev.completionScore,
        integrity: result.integrity ?? prev.integrity,
        transparency: result.transparency ?? prev.transparency,
        ratios: result.ratios || prev.ratios,
        gauges: result.gauges || prev.gauges,
        insight: result.insight || prev.insight,
      }))
    } catch {
      // Results may not be ready yet.
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    let disposed = false
    hasOpenedRef.current = false
    const candidates = wsUrlCandidates(sessionId)
    let idx = 0

    const wireSocket = (socket) => {
      socketRef.current = socket
      socket.onopen = () => {
        if (disposed) return
        hasOpenedRef.current = true
        setSocketState('open')
        setSocketError('')
        if (pendingStartRef.current) {
          try {
            socket.send(JSON.stringify({ command: 'start' }))
            pendingStartRef.current = false
          } catch {
            // ignore send errors
          }
        }
      }

      socket.onmessage = (event) => {
        let data = null
        try {
          data = JSON.parse(event.data)
        } catch {
          return
        }
        if (data.type === 'log') {
          setLogs((prev) => [data.payload, ...prev].slice(0, 80))
        } else if (data.type === 'metrics') {
          setMetrics(data.payload)
          if (Number(data?.payload?.completionScore || 0) >= 100) {
            void syncFinalResults()
          }
        } else if (data.type === 'error') {
          setSocketError(data?.payload?.message || 'WebSocket error')
        }
      }

      socket.onerror = () => {
        if (disposed) return
        setSocketState('error')
      }

      socket.onclose = () => {
        if (disposed) return
        // If we never opened, try fallbacks before declaring connection failure.
        if (!hasOpenedRef.current && idx < candidates.length - 1) {
          idx += 1
          setSocketState('connecting')
          wireSocket(new WebSocket(candidates[idx]))
          return
        }
        setSocketState('closed')
        // Try pulling final state once if stream closed after having opened.
        if (hasOpenedRef.current) {
          void syncFinalResults()
        }
        // Show error banner only when initial connect failed across all candidates.
        if (!hasOpenedRef.current) {
          setSocketError('Failed to connect live analysis stream.')
        }
      }
    }

    wireSocket(new WebSocket(candidates[idx]))

    return () => {
      disposed = true
      if (resultSyncTimerRef.current) {
        clearInterval(resultSyncTimerRef.current)
        resultSyncTimerRef.current = null
      }
      try {
        socketRef.current?.close()
      } catch {
        // ignore
      }
    }
  }, [sessionId, syncFinalResults])

  const startAnalysis = () => {
    if (!socketRef.current) {
      return
    }
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command: 'start' }))
      pendingStartRef.current = false
      if (resultSyncTimerRef.current) {
        clearInterval(resultSyncTimerRef.current)
      }
      // Poll final results in background as a reliability fallback.
      resultSyncTimerRef.current = setInterval(() => {
        void syncFinalResults()
      }, 2500)
    } else {
      // Queue start command so auto-start and fast clicks are reliable.
      pendingStartRef.current = true
    }
  }

  const canStart = socketState === 'open'

  return { logs, metrics, startAnalysis, canStart, socketState, socketError }
}
