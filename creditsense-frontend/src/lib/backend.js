import axios from 'axios'

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.trim() || 'http://localhost:8000'

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

export function camDownloadUrl(sessionId) {
  return `${BACKEND_BASE_URL}/api/sessions/${sessionId}/cam.docx`
}

export function wsUrl(sessionId) {
  const base = BACKEND_BASE_URL.replace(/^http/, 'ws')
  return `${base}/ws/analyze/${sessionId}`
}

