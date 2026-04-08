import { useEffect, useRef, useState } from 'react'
import { wsUrl } from '../lib/backend.js'

export const useAnalysis = (sessionId) => {
  const [logs, setLogs] = useState([])
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

  useEffect(() => {
    if (!sessionId) return
    const socket = new WebSocket(wsUrl(sessionId))
    socketRef.current = socket

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'log') {
        setLogs((prev) => [data.payload, ...prev].slice(0, 80))
      } else if (data.type === 'metrics') {
        setMetrics(data.payload)
      }
    }

    return () => {
      try {
        socket.close()
      } catch {
        // ignore
      }
    }
  }, [sessionId])

  const startAnalysis = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command: 'start' }))
    }
  }

  return { logs, metrics, startAnalysis }
}
