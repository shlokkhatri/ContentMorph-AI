// Small wrapper around fetch() with JWT Auth header handling

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function getAuthToken() {
  return localStorage.getItem('cm_token') || ''
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('cm_token', token)
  } else {
    localStorage.removeItem('cm_token')
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('cm_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('cm_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('cm_user')
  }
}

function getAuthHeaders(isJson = false) {
  const headers = {}
  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// --- Auth Endpoints ---

export async function registerUser(email, password, fullName) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed. Please check your details.')
  }
  setAuthToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Invalid email or password.')
  }
  setAuthToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function fetchCurrentUser() {
  const token = getAuthToken()
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(true),
    })
    if (!res.ok) {
      // Token expired or invalid
      setAuthToken(null)
      setStoredUser(null)
      return null
    }
    const user = await res.json()
    setStoredUser(user)
    return user
  } catch {
    return null
  }
}

export function logoutUser() {
  setAuthToken(null)
  setStoredUser(null)
}

// --- Content Transformation Endpoints ---

export async function fetchOutputTypes() {
  const res = await fetch(`${API_BASE}/api/output-types`)
  if (!res.ok) throw new Error('Could not load output types. Is the backend running?')
  return res.json()
}

export async function generateContent(formData) {
  const headers = getAuthHeaders(false) // FormData automatically sets multipart boundary
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: headers,
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || 'Generation failed. Please try again.')
  }
  return res.json()
}

export async function fetchHistory() {
  const token = getAuthToken()
  if (!token) return [] // If logged out, don't show history

  const res = await fetch(`${API_BASE}/api/history`, {
    headers: getAuthHeaders(true),
  })
  if (!res.ok) return []
  return res.json()
}

export async function fetchHistoryItem(id) {
  const res = await fetch(`${API_BASE}/api/history/${id}`, {
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('Could not load that generation')
  return res.json()
}

// Downloads a generation's presentation output as pptx, docx, or pdf.
export async function downloadGeneration(id, format) {
  const res = await fetch(`${API_BASE}/api/download/${id}/${format}`, {
    headers: getAuthHeaders(false),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || `Could not download the ${format.toUpperCase()} file.`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : `presentation.${format}`

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}