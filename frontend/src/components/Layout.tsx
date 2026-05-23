import { Outlet, NavLink, Link } from 'react-router-dom'
import { Shield, LayoutDashboard, History, Scan, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from './AuthModal'

export default function Layout() {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const navLinks = [
    { to: '/scan',      label: 'Scanner',   icon: Scan },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
    { to: '/history',   label: 'History',   icon: History, auth: true },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Noise overlay */}
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0 opacity-60" />

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-lime rounded-lg flex items-center justify-center transition-shadow group-hover:shadow-lime">
              <Shield className="w-4 h-4 text-ink" strokeWidth={2.5} />
            </div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">
              Link<span className="text-lime">Guard</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, auth }) =>
              !auth || user ? (
                <NavLink key={to} to={to} className={({ isActive }) =>
                  clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-white/8 text-white' : 'text-brand-muted hover:text-white hover:bg-white/5')}>
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ) : null
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-brand-muted truncate max-w-[160px]">{(user as any).email}</span>
                <button onClick={() => signOut.mutate()} className="btn-ghost gap-2">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setAuthOpen(true)} className="btn-ghost">Sign in</button>
                <button onClick={() => setAuthOpen(true)} className="btn-primary py-2">Get started</button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-0 right-0 z-40 bg-ink-2 border-b border-white/[0.06] md:hidden">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon, auth }) =>
                !auth || user ? (
                  <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive ? 'bg-white/8 text-white' : 'text-brand-muted hover:text-white')}>
                    <Icon className="w-4 h-4" />{label}
                  </NavLink>
                ) : null
              )}
              {!user && (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false) }} className="btn-primary mt-2 justify-center">
                  Sign in
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 pt-16 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <span>© 2025 LinkGuard AI. Built to protect every click.</span>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'API Docs', 'GitHub'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
