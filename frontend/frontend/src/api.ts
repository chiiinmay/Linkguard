const API = 'http://localhost:3000'

export async function scanUrl(inputUrl: string) {
  const res = await fetch(`${API}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: inputUrl, model: 'basic' })
  })
  return res.json()
}