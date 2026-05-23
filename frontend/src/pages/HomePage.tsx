import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, Brain, Eye, BarChart2, ArrowRight } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

const FEATURES = [
  { icon: Zap,      color: 'text-lime   bg-lime/10',   title: 'Sub-3s scanning',       desc: 'Logistic regression & Naive Bayes deliver instant verdicts for everyday checks.' },
  { icon: Brain,    color: 'text-cyan   bg-cyan/10',   title: 'BERT deep analysis',     desc: 'HuggingFace transformer reads page semantics — catches honeytrap language and impersonation.' },
  { icon: Shield,   color: 'text-coral  bg-coral/10',  title: 'Multi-source intel',     desc: 'Google Safe Browsing, VirusTotal, and WHOIS all queried in parallel for every scan.' },
  { icon: Eye,      color: 'text-amber-400 bg-amber-500/10', title: 'Redirect chain tracing', desc: 'Follows up to 10 hops, flagging cross-TLD redirects and domain-swap obfuscation.' },
  { icon: BarChart2,color: 'text-purple-400 bg-purple-400/10', title: 'SHAP explanations',    desc: 'Every verdict comes with the top signals that drove it — no black-box scores.' },
  { icon: Shield,   color: 'text-lime   bg-lime/10',   title: 'Self-improving model',   desc: 'Weekly retraining on new threat data and user feedback keeps accuracy rising.' },
]

const STATS = [
  { val: '99.2%', label: 'Detection rate' },
  { val: '<3s',   label: 'Avg scan time'  },
  { val: '200k+', label: 'Daily threats'  },
  { val: '0.1%',  label: 'False positives'},
]

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-lime/[0.07] rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-cyan/[0.05] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-coral/[0.05] rounded-full blur-[100px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(198,241,53,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(198,241,53,.6) 1px,transparent 1px)', backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 80%)' }} />
        </div>

        <div className="relative max-w-4xl">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime/10 border border-lime/25 text-lime text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse-slow" />
            Powered by BERT + Google Safe Browsing + VirusTotal
          </motion.div>

          <motion.h1 {...fadeUp(0.08)}
            className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold text-white leading-[1.0] tracking-tight">
            Stop <span className="text-coral">phishing</span>,<br />
            traps &amp; <span className="text-lime">scams</span><br />
            before you <span className="text-cyan">click</span>.
          </motion.h1>

          <motion.p {...fadeUp(0.16)}
            className="text-lg sm:text-xl text-brand-muted max-w-xl mx-auto mt-6 leading-relaxed font-light">
            LinkGuard AI scans every URL in real-time — machine learning meets
            transformer intelligence to detect threats in under 3 seconds.
          </motion.p>

          <motion.div {...fadeUp(0.22)} className="flex gap-4 justify-center flex-wrap mt-10">
            <Link to="/scan" className="btn-primary text-base px-8 py-4">
              <Shield className="w-5 h-5" /> Scan a URL now
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base px-8 py-4">
              View dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(0.30)} className="flex justify-center gap-10 sm:gap-16 flex-wrap mt-16">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-brand-muted mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-28">
        <div className="text-center mb-14">
          <p className="section-eyebrow">Capabilities</p>
          <h2 className="section-title">Built for the real threat landscape</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card card-hover p-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color.split(' ')[1]}`}>
                <f.icon className={`w-5 h-5 ${f.color.split(' ')[0]}`} />
              </div>
              <h3 className="font-display font-bold text-white text-base mb-2">{f.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="relative mx-4 sm:mx-6 mb-20 rounded-3xl overflow-hidden border border-lime/20 bg-lime/5">
        <div className="absolute inset-0 bg-gradient-to-r from-lime/10 via-transparent to-cyan/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-10 max-w-5xl mx-auto">
          <div>
            <h3 className="font-display font-extrabold text-white text-2xl">Try the scanner now</h3>
            <p className="text-brand-muted text-sm mt-1">No account needed. Paste any link and get an instant AI verdict.</p>
          </div>
          <Link to="/scan" className="btn-primary text-base px-8 py-4 whitespace-nowrap flex-shrink-0">
            Open scanner <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
