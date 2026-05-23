import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { User } from '@/types'

export function useAuth() {
  const { user, setUser } = useAuthStore()

  // Listen to Supabase auth events
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user as unknown as User)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as unknown as User ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [setUser])

  const signIn = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    onSuccess: () => toast.success('Signed in!'),
    onError: (e: Error) => toast.error(e.message),
  })

  const signUp = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    },
    onSuccess: () => toast.success('Check your email to confirm your account'),
    onError: (e: Error) => toast.error(e.message),
  })

  const signOut = useMutation({
    mutationFn: () => supabase.auth.signOut(),
    onSuccess: () => { setUser(null); toast.success('Signed out') },
  })

  return { user, signIn, signUp, signOut }
}
