import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Props { open: boolean; onClose: () => void }

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuth()

  const loading = signIn.isPending || signUp.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signin') {
      await signIn.mutateAsync({ email, password })
    } else {
      await signUp.mutateAsync({ email, password })
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-ink-2 rounded-2xl border border-white/[0.08] p-6 shadow-glow">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-lime" />
                <span className="font-display font-bold text-white">
                  {mode === 'signin' ? 'Sign in to LinkGuard' : 'Create account'}
                </span>
              </div>
              <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-brand-muted font-medium">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-base pl-10" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-brand-muted font-medium">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" minLength={8}
                    className="input-base pl-10" />
                </div>
              </label>

              <button type="submit" disabled={loading} className="btn-primary justify-center mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-brand-muted mt-4">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
                className="text-lime hover:underline font-medium">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
