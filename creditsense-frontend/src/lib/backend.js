import axios from 'axios'

const explicitBackend = import.meta.env.VITE_BACKEND_URL?.trim()
const explicitWs = import.meta.env.VITE_WS_URL?.trim()
const inferredOrigin =
  import.meta.env.DEV
    ? 'http://localhost:8000'
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:8000'

export const BACKEND_BASE_URL = explicitBackend || inferredOrigin

export const api = axios.create({
  baseURL: BACKEND_BASE_URL,
})

export async function createSession({ company_name, loan_amount }) {
  const { data } = await api.post('/api/sessions', { company_name, loan_amount })
  return data
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}`)
  return data
}

export async function uploadDocument(sessionId, docType, file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post(`/api/sessions/${sessionId}/documents/${docType}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getResults(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}/results`)
  return data
}

export async function verifyDocumentIntegrity(sessionId, file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post(`/api/sessions/${sessionId}/verify-document`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export function camDownloadUrl(sessionId) {
  return `${BACKEND_BASE_URL}/api/sessions/${sessionId}/cam.docx`
}

export function wsUrl(sessionId) {
  const base = (explicitWs || BACKEND_BASE_URL).replace(/^http/, 'ws')
  return `${base}/ws/analyze/${sessionId}`
}

export function wsUrlCandidates(sessionId) {
  const urls = []
  if (explicitWs) {
    urls.push(`${explicitWs.replace(/\/$/, '')}/ws/analyze/${sessionId}`)
  } else {
    urls.push(wsUrl(sessionId))
  }

  // Dev fallback: many users run backend on 8501 instead of 8000.
  if (import.meta.env.DEV && !explicitWs && !explicitBackend) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    urls.push(`ws://${host}:8501/ws/analyze/${sessionId}`)
    urls.push(`ws://localhost:8000/ws/analyze/${sessionId}`)
  }

  return [...new Set(urls)]
}

