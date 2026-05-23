import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

// ── Supabase ──────────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// ── Axios API client ──────────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

// Normalise error shape
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? err.message ?? 'Unknown error'
    return Promise.reject({ message, status: err.response?.status })
  },
)
