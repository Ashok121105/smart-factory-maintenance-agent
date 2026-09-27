const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    const error = new Error('Backend unavailable. Please check that the maintenance server is running.')
    error.code = 'BACKEND_UNAVAILABLE'
    throw error
  }

  const responseText = await response.text()
  let payload = {}
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = {}
    }
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error || `Request failed with status ${response.status}`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export function apiGet(path) {
  return request(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}