import { useState, useEffect, useRef } from 'react'
import { toPng } from 'html-to-image'
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion'
import {
  Heart, Thermometer, Lock, Unlock, Sparkles, FileText,
  CheckCircle, ArrowRight, X, Brain, Shield, TrendingUp,
  ChevronRight, ChevronLeft, Star, Flame, Leaf, Sun, Moon,
  Wind, Clock, Eye, RefreshCw, AlertCircle, Mail, ExternalLink,
  UserCheck, ShieldCheck, BadgeCheck, Zap,
  Download, Share2, Copy, Check, Quote, Send
} from 'lucide-react'

import {
  DIMENSIONS, QUESTIONS, ANSWERS, MILESTONES, PROFILES,
  encodeAnswers, decodeAnswers, calcResults, parseCode, getDimText,
} from './lib/quiz.js'

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

function track(event, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

// ─── ECPAY UTILITIES ─────────────────────────────────────────────────────────

function generateTradeNo() {
  const d = new Date()
  const pad = (n, l = 2) => String(n).padStart(l, '0')
  return `KM${String(d.getFullYear()).slice(-2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
}

function formatTradeDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const ECPAY_PARAMS = {
  MerchantID: '3002607',
  TotalAmount: 299,
  ItemName: 'KindlesMind 深度關係診斷處方箋',
  TradeDesc: 'KindlesMind 靈魂處方箋數位報告',
  ReturnURL: 'https://kindlesmind.com/ecpay/notify',
  ClientBackURL: 'https://kindlesmind.com/result',
  PaymentType: 'aio',
  ChoosePayment: 'ALL',
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Orb({ x, y, size, color, opacity = 0.07, delay = 0 }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, opacity }}
      animate={{ scale: [1, 1.15, 1], opacity: [opacity, opacity * 1.6, opacity] }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

function DimBar({ dim, pct, delay = 0, text }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-warm-text">
          <dim.Icon size={12} style={{ color: dim.color }} />
          {dim.name}
        </span>
        <span className="text-xs font-bold" style={{ color: dim.color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-warm-cream-dark rounded-full overflow-hidden mb-2">
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${dim.color}99, ${dim.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay, ease: 'easeOut' }}
        />
      </div>
      {text && (
        <p className="text-sm leading-relaxed italic px-0.5" style={{ color: dim.color + 'CC' }}>{text}</p>
      )}
    </div>
  )
}

function CreditCardBadges() {
  const cards = [
    { label: 'VISA',   bg: '#1A1F71', color: '#fff', italic: true,  fw: 800 },
    { label: 'MC',     bg: 'linear-gradient(90deg,#EB001B 38%,#F79E1B)', color: '#fff', fw: 700 },
    { label: 'JCB',    bg: 'linear-gradient(135deg,#003087 0%,#009F6B 100%)', color: '#fff', fw: 700 },
    { label: 'ATM',    bg: '#6B7CB5', color: '#fff', fw: 600 },
    { label: '超商代碼', bg: '#E8956A', color: '#fff', fw: 600 },
  ]
  return (
    <div className="flex items-center justify-center flex-wrap gap-1.5 mb-4">
      {cards.map((c, i) => (
        <div key={i}
          className="h-6 px-2.5 rounded-md flex items-center justify-center text-white select-none"
          style={{
            background: c.bg, fontWeight: c.fw, fontSize: '9px',
            fontStyle: c.italic ? 'italic' : 'normal',
            minWidth: c.label.length > 4 ? '52px' : '36px',
            letterSpacing: c.italic ? '0.04em' : 0,
          }}>
          {c.label}
        </div>
      ))}
    </div>
  )
}

function MonochromeBadges() {
  const cards = [
    { label: 'VISA', italic: true, fw: 800 },
    { label: 'MC', fw: 600 },
    { label: 'JCB', fw: 600 },
    { label: 'ATM', fw: 600 },
    { label: '超商', fw: 600 },
  ]
  return (
    <div className="flex items-center justify-center gap-1.5">
      {cards.map((c, i) => (
        <div key={i}
          className="h-5 px-2 rounded-md border flex items-center justify-center select-none"
          style={{
            borderColor: '#C4BAD8', color: '#A898C0', backgroundColor: '#FAF8FE',
            fontSize: '8px', fontWeight: c.fw,
            fontStyle: c.italic ? 'italic' : 'normal',
            minWidth: c.label.length > 3 ? '30px' : '26px',
          }}>
          {c.label}
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}>
        <Icon size={12} style={{ color }} />
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>{children}</span>
    </div>
  )
}

function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9999,
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

function SoulMap({ dimData }) {
  const positions = [[100, 72], [128, 100], [100, 128], [72, 100]]
  return (
    <svg viewBox="0 0 200 200" style={{ width: 110, height: 110 }}>
      <defs>
        <filter id="blob-blur">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>
      {dimData.map((d, i) => {
        const radius = 24 + ((d.score - 7) / 28) * 20
        return (
          <circle key={i} cx={positions[i][0]} cy={positions[i][1]}
            r={radius} fill={d.color} opacity={0.65} filter="url(#blob-blur)" />
        )
      })}
    </svg>
  )
}

// ─── RADAR CHART ─────────────────────────────────────────────────────────────
//  4-axis diamond radar. Center (110,110), max-radius 80.
//  Axis layout: A=top, B=right, C=bottom, D=left
function RadarChart({ radarData }) {
  const CX = 110, CY = 110, R = 80
  // axis unit vectors [dx, dy] for A B C D
  const axes = [
    { dx:  0, dy: -1 }, // A: up
    { dx:  1, dy:  0 }, // B: right
    { dx:  0, dy:  1 }, // C: down
    { dx: -1, dy:  0 }, // D: left
  ]
  // Background grid rings at 25 / 50 / 75 / 100 %
  const gridRings = [0.25, 0.5, 0.75, 1.0]
  const ringPoly = (frac) =>
    axes.map(a => `${CX + a.dx * R * frac},${CY + a.dy * R * frac}`).join(' ')

  // Data polygon
  const dataPoly = radarData.map((d, i) => {
    const frac = d.pct / 100
    return `${CX + axes[i].dx * R * frac},${CY + axes[i].dy * R * frac}`
  }).join(' ')

  // Axis tip labels
  const labels = [
    { x: CX,     y: CY - R - 14, anchor: 'middle',  text: '焦慮', dim: radarData[0] },
    { x: CX + R + 14, y: CY + 4,  anchor: 'start',   text: '迴避', dim: radarData[1] },
    { x: CX,     y: CY + R + 18, anchor: 'middle',  text: '原生', dim: radarData[2] },
    { x: CX - R - 14, y: CY + 4,  anchor: 'end',    text: '衝突', dim: radarData[3] },
  ]

  return (
    <svg viewBox="-25 0 270 220" style={{ width: '100%', height: 'auto' }}>
      <defs>
        {radarData.map((d, i) => (
          <linearGradient key={i} id={`rg${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={d.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={d.color} stopOpacity="0.2" />
          </linearGradient>
        ))}
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC8DF3" />
          <stop offset="100%" stopColor="#33ABD3" />
        </linearGradient>
        <linearGradient id="dataFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DC8DF3" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#33ABD3" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {gridRings.map((f, i) => (
        <polygon key={i} points={ringPoly(f)}
          fill="none"
          stroke={i === 3 ? '#D0C8E8' : '#E8E4F4'}
          strokeWidth={i === 3 ? 1 : 0.7}
          strokeDasharray={i < 3 ? '3 3' : 'none'} />
      ))}

      {/* Axis lines */}
      {axes.map((a, i) => (
        <line key={i}
          x1={CX} y1={CY}
          x2={CX + a.dx * R} y2={CY + a.dy * R}
          stroke="#D8D0EC" strokeWidth="0.8" />
      ))}

      {/* Data polygon */}
      <polygon points={dataPoly}
        fill="url(#dataFill)"
        stroke="url(#brandGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round" />

      {/* Data vertex dots */}
      {radarData.map((d, i) => {
        const frac = d.pct / 100
        return (
          <circle key={i}
            cx={CX + axes[i].dx * R * frac}
            cy={CY + axes[i].dy * R * frac}
            r="3.5"
            fill={d.color}
            stroke="#fff"
            strokeWidth="1.5" />
        )
      })}

      {/* Axis tip labels */}
      {labels.map((l, i) => (
        <text key={i}
          x={l.x} y={l.y}
          textAnchor={l.anchor}
          fontSize="9"
          fontWeight="600"
          fill={l.dim.color}
          fontFamily="'Noto Sans TC', sans-serif">
          {l.text}
        </text>
      ))}

      {/* Percentage labels on vertices */}
      {radarData.map((d, i) => {
        const frac = d.pct / 100
        const vx = CX + axes[i].dx * R * frac
        const vy = CY + axes[i].dy * R * frac
        // nudge label away from center
        const nudge = 10
        const lx = vx + axes[i].dx * nudge
        const ly = vy + axes[i].dy * nudge
        if (d.pct < 5) return null
        return (
          <text key={i} x={lx} y={ly + 3}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill={d.color}
            fontFamily="'Noto Sans TC', sans-serif">
            {d.pct}%
          </text>
        )
      })}
    </svg>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroScreen({ onStart, onCode }) {
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState(false)

  const handleCode = () => {
    const result = parseCode(codeInput)
    if (!result) { setCodeError(true); return }
    setCodeError(false)
    onCode(result)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <Orb x="-5%" y="15%" size={320} color="#DC8DF3" delay={0} />
      <Orb x="75%" y="60%" size={260} color="#33ABD3" opacity={0.07} delay={3} />
      <Orb x="40%" y="40%" size={500} color="#DC8DF3" opacity={0.04} delay={5} />

      {/* Logo */}
      <motion.div className="flex flex-col items-center mb-10"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.div className="relative mb-5"
          animate={{ filter: ['drop-shadow(0 0 12px rgba(220,141,243,0.4))', 'drop-shadow(0 0 32px rgba(220,141,243,0.75))', 'drop-shadow(0 0 12px rgba(220,141,243,0.4))'] }}
          transition={{ duration: 3, repeat: Infinity }}>
          <img src="/logo.png" alt="KindlesMind" className="w-16 h-16 rounded-2xl shadow-terracotta-lg" />
        </motion.div>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-warm-text mb-1">KindlesMind</h1>
        <p className="text-warm-text-muted text-xs tracking-[0.25em] uppercase">Attachment Style Diagnosis</p>
      </motion.div>

      {/* Tagline */}
      <motion.div className="text-center mb-8 max-w-xs"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p className="font-serif text-2xl text-warm-text leading-snug mb-3 font-medium">
          總在關係中後退一步？<br />測測你的依附類型
        </p>
        <p className="text-warm-text-muted text-sm leading-relaxed">
          基於依附理論，二十八道情境題。<br />
          <span style={{ background: 'linear-gradient(90deg,#DC8DF3,#33ABD3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>找出你是安全型、焦慮型、還是迴避型。</span>
        </p>
      </motion.div>

      {/* ── Dimension preview ── */}
      <motion.div className="mb-8 grid grid-cols-2 gap-2 w-full max-w-xs"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        {DIMENSIONS.map(dim => (
          <div key={dim.id}
            className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2.5 border border-warm-cream-dark/40 shadow-warm-sm">
            <dim.Icon size={13} style={{ color: dim.color }} />
            <div>
              <div className="text-warm-text text-xs font-medium">{dim.name}</div>
              <div className="text-warm-text-light text-xs">{dim.sub}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Psychologist endorsement (subtle) ── */}
      <motion.div className="mt-6 w-full max-w-xs opacity-70"
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.9 }}>
        <div className="flex items-center gap-2.5 mb-2">
          <img src="/psychologist2.jpg" alt="葉信儂"
            className="w-8 h-8 rounded-full object-cover"
            style={{ border: '1px solid rgba(155,126,166,0.2)' }} />
          <p className="text-warm-text-muted text-xs">
            <span className="text-warm-text-muted font-medium">葉信儂</span> 心理師推薦
          </p>
        </div>
        <p className="text-warm-text-muted text-xs leading-relaxed italic pl-10">
          「我推薦這份測驗給想更了解自己依附模式的人，它能幫你看見關係中未察覺的盲點。」
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        className="mt-8 group relative overflow-hidden px-10 py-4 rounded-2xl text-white font-medium text-base shadow-terracotta-lg"
        style={{ background: 'linear-gradient(135deg, #DC8DF3, #33ABD3)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={onStart}>
        <span className="relative z-10 flex items-center gap-2">
          進入夢境，開始診斷
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(135deg, #C060E8, #1F8CB5)' }} />
      </motion.button>

      <motion.p className="text-warm-text-light text-xs mt-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
        約 8 分鐘完成 · 28 道情境題目 · 4 個靈魂維度
      </motion.p>

      {/* ── Code lookup ── */}
      <motion.div className="mt-6 w-full max-w-xs"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        <p className="text-center text-xs text-warm-text-light mb-2">已有診斷代碼？直接查看結果</p>
        <div className="flex items-center gap-2">
          <input
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value); setCodeError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleCode()}
            aria-label="診斷代碼"
            aria-invalid={codeError}
            aria-describedby={codeError ? 'code-error' : undefined}
            placeholder="KM-04-A3B3C3D4"
            className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: codeError ? '1.5px solid #D48C70' : '1.5px solid rgba(155,126,166,0.3)',
              color: '#434242', fontFamily: 'Noto Sans TC, sans-serif',
              letterSpacing: '0.06em'
            }} />
          <motion.button
            onClick={handleCode}
            whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: '#9B7EA6' }}>
            查看
          </motion.button>
        </div>
        {codeError && (
          <p id="code-error" role="alert" className="text-xs mt-1.5 text-center" style={{ color: '#D48C70' }}>
            代碼格式錯誤，請確認後再試
          </p>
        )}
      </motion.div>

      {/* ── User reviews marquee ── */}
      <motion.div className="mt-10 w-screen overflow-hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <div className="marquee-track">
          {[0, 1].map(copy => (
            <div key={copy} className="marquee-slide" aria-hidden={copy === 1}>
              {[
                { text: '做完才發現自己一直在用迴避的方式面對親密關係，處方建議很具體實用。', name: 'L', age: 28 },
                { text: '比星座準太多了…每一句都像在說我，看完忍不住轉給另一半。', name: '小魚', age: 32 },
                { text: '原來我的焦慮不是沒有原因的，第一次覺得被理解。', name: 'A', age: 25 },
                { text: '終於理解為什麼每次吵架都想逃，報告寫得好細膩。', name: 'Mia', age: 30 },
                { text: '跟男友一起測，互相看對方的報告，溝通變順暢了。', name: '阿晴', age: 27 },
              ].map((review, i) => (
                <div key={i}
                  className="rounded-xl px-4 py-3 border flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.5)', borderColor: 'rgba(155,126,166,0.15)', width: 220 }}>
                  <div className="flex gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={10} fill="#F5C34B" stroke="#F5C34B" />
                    ))}
                  </div>
                  <p className="text-warm-text text-xs leading-relaxed mb-1.5">「{review.text}」</p>
                  <p className="text-right text-xs" style={{ color: '#B0A0C8' }}>— {review.name}, {review.age}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className="flex items-center gap-5 mt-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
        {[
          { Icon: Star,  label: '4.9 評分', sub: '心理師顧問認證' },
          { Icon: Heart, label: '12,400+', sub: '已完成診斷' },
          { Icon: Shield,label: '匿名保護', sub: '資料不被儲存' },
        ].map(({ Icon, label, sub }, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Icon size={11} style={{ color: '#DC8DF3' }} />
              <span className="text-warm-text text-xs font-semibold">{label}</span>
            </div>
            <span className="text-warm-text-light text-xs">{sub}</span>
          </div>
        ))}
      </motion.div>

    </div>
  )
}

// ─── QUIZ ────────────────────────────────────────────────────────────────────

function MilestoneCard({ milestone, onContinue }) {
  const pct = milestone.progress
  const r = 40, circ = 2 * Math.PI * r
  const strokeDash = (pct / 100) * circ
  return (
    <motion.div className="fixed inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ overscrollBehavior: 'none' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm bg-white rounded-3xl shadow-warm-xl border border-warm-cream-dark/40 p-8 text-center"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}>
        {/* Circle progress */}
        <div className="w-24 h-24 mx-auto mb-6">
          <svg width="96" height="96" viewBox="0 0 96 96" className="block">
            <defs>
              <linearGradient id="mgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC8DF3" />
                <stop offset="100%" stopColor="#33ABD3" />
              </linearGradient>
            </defs>
            <g transform="rotate(-90 48 48)">
              <circle cx="48" cy="48" r={r} fill="none" stroke="#E0D8F4" strokeWidth="6" />
              <motion.circle cx="48" cy="48" r={r} fill="none" stroke="url(#mgGrad)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - strokeDash }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </g>
            <text
              x="48" y="48"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '20px', fontWeight: 700, fill: '#9B7EA6' }}
            >
              {pct}%
            </text>
          </svg>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="font-serif text-lg text-warm-text font-semibold leading-snug mb-3">
            {milestone.title}
          </p>
          <p className="text-warm-text-muted text-sm leading-relaxed mb-6">{milestone.body}</p>

          <div className="bg-warm-cream rounded-2xl px-4 py-3 mb-6 border border-warm-cream-dark/30">
            <p className="text-warm-text-muted text-xs mb-0.5">接下來進入</p>
            <p className="font-serif text-warm-text font-semibold">{milestone.nextDim}</p>
            <p className="text-warm-text-light text-xs">{milestone.nextSub}</p>
          </div>

          <motion.button
            className="w-full py-3.5 rounded-2xl text-white font-medium shadow-warm"
            style={{ background: 'linear-gradient(135deg, #DC8DF3, #33ABD3)' }}
            onClick={onContinue}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            繼續前行 <ArrowRight size={14} className="inline ml-1" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function QuizScreen({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState(1)
  const [milestone, setMilestone] = useState(null) // null | milestone obj

  const q = QUESTIONS[currentQ]
  const dim = DIMENSIONS.find(d => d.id === q.dim)
  const progressPct = Math.round(((currentQ) / 28) * 100)

  const progressMessages = {
    0:   '第一章：親密焦慮的迴聲',
    25:  '第二章：迴避的地形圖',
    50:  '第三章：家族記憶的迴響',
    75:  '第四章：衝突的應激模式',
    100: '解析完成 · 繪製中',
  }
  const nearestMsg = [75, 50, 25, 0].find(p => progressPct >= p)

  const handleOptionClick = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    setTimeout(() => {
      const answer = { dim: q.dim, weight: ANSWERS[idx].weight, qid: q.id }
      const newAnswers = [...answers, answer]

      const ms = MILESTONES.find(m => m.afterIdx === currentQ)
      if (ms) {
        setAnswers(newAnswers)
        setSelected(null)
        setMilestone(ms)
        return
      }
      if (currentQ === 27) {
        setAnswers(newAnswers)
        onComplete(newAnswers)
        return
      }
      setDirection(1)
      setAnswers(newAnswers)
      setSelected(null)
      setCurrentQ(q => q + 1)
    }, 380)
  }

  const handlePrev = () => {
    if (currentQ === 0) return
    setDirection(-1)
    setSelected(null)
    setAnswers(a => a.slice(0, -1))
    setCurrentQ(q => q - 1)
  }

  const handleMilestoneContinue = () => {
    setMilestone(null)
    setDirection(1)
    setCurrentQ(q => q + 1)
  }

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
  }

  if (milestone) {
    return (
      <AnimatePresence mode="wait">
        <MilestoneCard key="milestone" milestone={milestone} onContinue={handleMilestoneContinue} />
      </AnimatePresence>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col max-w-lg mx-auto overflow-hidden" style={{ overscrollBehavior: 'none' }}>
      {/* Header progress */}
      <div className="flex-shrink-0 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: dim.color + '20' }}>
              <dim.Icon size={12} style={{ color: dim.color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: dim.color }}>{dim.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {nearestMsg !== undefined && (
              <span className="text-xs font-medium" style={{ color: dim.color }}>{progressMessages[nearestMsg]}</span>
            )}
            <span className="text-warm-text-muted text-xs">{currentQ + 1} / 28</span>
          </div>
        </div>
        <div className="h-1 bg-warm-cream-dark rounded-full overflow-hidden"
          role="progressbar"
          aria-label="測驗進度"
          aria-valuemin={0}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={currentQ + 1}
          aria-valuetext={`第 ${currentQ + 1} 題，共 ${QUESTIONS.length} 題`}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${dim.color}99, ${dim.color})` }}
            animate={{ width: `${progressPct + 5}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        {/* Dim dots */}
        <div className="flex gap-1.5 mt-2.5">
          {DIMENSIONS.map((d, i) => (
            <div key={d.id} className="flex gap-0.5">
              {[0,1,2,3,4,5,6].map(j => {
                const qIdx = i * 7 + j
                return (
                  <div key={j} className="h-1 w-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: qIdx < currentQ
                        ? d.color
                        : qIdx === currentQ
                          ? d.color + '99'
                          : '#E0D8F4'
                    }} />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Question card — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-3">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQ} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
            <div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6">
              {/* Dim badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-xs font-medium"
                style={{ backgroundColor: dim.color + '18', color: dim.color, border: `1px solid ${dim.color}30` }}>
                <dim.Icon size={11} />
                {dim.name} · Q{q.id}
              </div>

              <p className="font-serif text-lg text-warm-text leading-relaxed font-medium">
                {q.text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom bar — anchor labels + 1–5 buttons + nav */}
      <div className="flex-shrink-0 px-5 pt-3 bg-warm-bg border-t border-warm-cream-dark/20" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Anchor labels */}
        <div className="flex justify-between text-xs leading-snug mb-3 px-0.5" style={{ color: '#2B1A42' }}>
          <span className="max-w-[42%]">{q.anchor1}</span>
          <span className="max-w-[42%] text-right">{q.anchor5}</span>
        </div>

        {/* 1–5 Likert scale */}
        <div className="flex justify-between gap-2 mb-3">
          {ANSWERS.map((ans, i) => (
            <motion.button key={i}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all duration-200"
              style={selected === i
                ? { borderColor: dim.color, backgroundColor: dim.color, color: '#fff' }
                : {
                    borderColor: '#DDD5F0',
                    backgroundColor: selected !== null && selected !== i ? '#F8F6FF' : '#F3EFF9',
                    color: '#9B90B8',
                    opacity: selected !== null && selected !== i ? 0.5 : 1,
                  }}
              onClick={() => handleOptionClick(i)}
              whileTap={{ scale: 0.95 }}>
              <span className="text-lg font-bold leading-none">{ans.weight}</span>
            </motion.button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex justify-between items-center">
          <button onClick={handlePrev} disabled={currentQ === 0}
            className="flex items-center gap-1 text-warm-text-muted text-sm disabled:opacity-25 hover:text-warm-text transition-colors">
            <ChevronLeft size={16} /> 前一題
          </button>
          <span className="text-warm-text-light text-xs">點選選項自動前進</span>
        </div>
      </div>
    </div>
  )
}

// ─── CALCULATING ─────────────────────────────────────────────────────────────

function CalculatingScreen() {
  const [step, setStep] = useState(0)
  const steps = [
    '解析你的情感場域頻率…',
    '繪製親密距離的地形圖…',
    '校準原生家庭的深層迴響…',
    '生成你的靈魂原色地圖…',
  ]
  useEffect(() => {
    steps.forEach((_, i) => setTimeout(() => setStep(i), i * 750))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Orb x="10%" y="20%" size={250} color="#DC8DF3" opacity={0.10} />
      <Orb x="60%" y="55%" size={200} color="#33ABD3" opacity={0.08} delay={2} />

      {/* Breathing orb */}
      <div className="relative mb-10">
        {[200, 150, 100].map((size, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: -size / 2, top: -size / 2,
              border: i < 2 ? `1.5px solid rgba(155,126,166,${0.12 + i * 0.1})` : undefined,
              background: i === 2 ? 'radial-gradient(circle, #9B7EA6, #7B5E8A)' : undefined,
            }}
            animate={{ scale: [1, 1.08 + i * 0.04, 1], opacity: [0.4 + i * 0.25, 1, 0.4 + i * 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        ))}
        <motion.div className="relative w-24 h-24"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <img src="/logo.png" alt="KindlesMind" className="w-24 h-24 rounded-full shadow-warm-xl" />
        </motion.div>
      </div>

      <motion.h2 className="font-serif text-2xl text-warm-text font-medium mb-2 text-center"
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3.5, repeat: Infinity }}>
        正在繪製你的靈魂地圖…
      </motion.h2>
      <p className="text-warm-text-muted text-sm mb-8 text-center">請保持呼吸，靜靜等待</p>

      <div className="space-y-2.5 w-full max-w-xs">
        {steps.map((text, i) => (
          <motion.div key={i}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500"
            style={i <= step ? { backgroundColor: 'rgba(220,141,243,0.08)' } : {}}
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: i <= step ? 1 : 0.25 }}
            transition={{ delay: i * 0.18 }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
              style={{
                backgroundColor: i < step ? '#DC8DF3' : i === step ? '#33ABD3' : '#E0D8F4'
              }}>
              {i < step
                ? <CheckCircle size={12} className="text-white" />
                : <div className="w-2 h-2 rounded-full bg-white opacity-80" />
              }
            </div>
            <span className={`text-sm ${i <= step ? 'text-warm-text' : 'text-warm-text-muted'}`}>{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── SHARE CARD ──────────────────────────────────────────────────────────────

function ShareCard({ profile, dimData, radarData, diagCode, cardRef }) {
  const ac = profile.accentColor || '#6B7CB5'
  const dims = [
    { label: '焦慮', val: radarData?.[0]?.pct ?? dimData[0]?.pct ?? 50 },
    { label: '迴避', val: radarData?.[1]?.pct ?? dimData[1]?.pct ?? 50 },
    { label: '原生', val: radarData?.[2]?.pct ?? dimData[2]?.pct ?? 50 },
    { label: '衝突', val: radarData?.[3]?.pct ?? dimData[3]?.pct ?? 50 },
  ]
  const paradox = profile.soulParadox || profile.summary || ''
  const monthColors = ['#D48C70', '#7B9EE8', '#6B7CB5']

  return (
    <div ref={cardRef} style={{
      width: 640,
      background: 'linear-gradient(145deg,#F9F6FF 0%,#EDE8F7 55%,#F2EDF8 100%)',
      fontFamily: 'Noto Serif TC, serif',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* bg deco */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(180,160,220,0.13)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 120, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(200,175,230,0.09)', pointerEvents: 'none' }} />

      {/* ── Header ── */}
      <div style={{ padding: '44px 48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#B0A0C8', marginBottom: 20, textTransform: 'uppercase', fontFamily: 'Noto Sans TC, sans-serif', margin: '0 0 20px' }}>KINDLESMIND &nbsp;·&nbsp; 靈魂原型診斷</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <span style={{ fontSize: 42, lineHeight: 1 }}>{profile.emoji}</span>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: '#2E2150', margin: 0, lineHeight: 1.2 }}>{profile.label}</h2>
              <p style={{ fontSize: 14, color: ac, margin: '5px 0 0', fontFamily: 'Noto Sans TC, sans-serif', fontWeight: 500 }}>{profile.tag}</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: 2 }}>
          <p style={{ fontSize: 10, color: '#C0B0D8', fontFamily: 'Noto Sans TC, sans-serif', margin: '0 0 4px', letterSpacing: '0.08em' }}>診斷代碼</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: ac, fontFamily: 'Noto Sans TC, sans-serif', margin: 0, letterSpacing: '0.06em' }}>{diagCode}</p>
        </div>
      </div>

      {/* ── Dim bars ── */}
      <div style={{ padding: '0 48px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>
          {dims.map((d, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#7B6A9A', fontFamily: 'Noto Sans TC, sans-serif' }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4A3D6B', fontFamily: 'Noto Sans TC, sans-serif' }}>{d.val}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 4, background: 'rgba(180,160,220,0.22)' }}>
                <div style={{ height: 5, borderRadius: 4, width: `${d.val}%`, background: `linear-gradient(90deg,${ac},rgba(155,126,166,0.8))` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Soul paradox quote ── */}
      <div style={{ margin: '0 48px 28px', borderLeft: `3px solid ${ac}88`, paddingLeft: 18 }}>
        <p style={{ fontSize: 12, color: '#6B5A8A', lineHeight: 1.85, margin: 0, fontStyle: 'italic' }}>
          {paradox.slice(0, 130)}{paradox.length > 130 ? '…' : ''}
        </p>
      </div>

      {/* ── Full 3-month Prescription ── */}
      <div style={{ margin: '0 36px 36px', borderRadius: 18, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(196,184,228,0.35)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid rgba(196,184,228,0.25)', background: 'rgba(255,255,255,0.5)' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', color: '#A898C0', textTransform: 'uppercase', fontFamily: 'Noto Sans TC, sans-serif', margin: '0 0 3px' }}>療癒處方</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3A2E58', margin: 0, fontFamily: 'Noto Sans TC, sans-serif' }}>接下來，你可以這樣做</p>
        </div>
        <div style={{ padding: '16px 28px 8px' }}>
          {profile.prescription?.map((month, mi) => (
            <div key={mi} style={{ position: 'relative', paddingLeft: 20, paddingBottom: mi < 2 ? 20 : 4, borderLeft: `2px solid ${monthColors[mi]}` }}>
              {/* Timeline dot */}
              <div style={{ position: 'absolute', left: -5, top: 2, width: 8, height: 8, borderRadius: '50%', background: monthColors[mi] }} />
              <p style={{ fontSize: 10, color: '#A898C0', fontFamily: 'Noto Sans TC, sans-serif', margin: '0 0 2px' }}>{month.month}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: monthColors[mi], margin: '0 0 10px', fontFamily: 'Noto Sans TC, sans-serif' }}>{month.title}</p>
              {month.steps?.map((s, si) => (
                <div key={si} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${monthColors[mi]}18`, border: `1px solid ${monthColors[mi]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 9, color: monthColors[mi], fontWeight: 700, fontFamily: 'Noto Sans TC, sans-serif' }}>{si + 1}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#5A4A76', lineHeight: 1.7, margin: 0, fontFamily: 'Noto Sans TC, sans-serif' }}>{s}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '0 48px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: '#C0B0D0', margin: 0, fontFamily: 'Noto Sans TC, sans-serif' }}>kindlesmind.com · 靈魂溫度診斷</p>
        <p style={{ fontSize: 10, color: '#C0B0D0', margin: 0, fontFamily: 'Noto Sans TC, sans-serif' }}>僅供個人參考</p>
      </div>
    </div>
  )
}

// ─── RESULT ──────────────────────────────────────────────────────────────────

function FullReport({ profile, dimData, diagCode, radarData }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [cachedBlob, setCachedBlob] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

  // Pre-generate share image in background so download button works instantly
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!cardRef.current) return
      try {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
        const res = await fetch(dataUrl)
        setCachedBlob(await res.blob())
      } catch (e) { /* silent - will generate on demand */ }
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  const doShare = (blob) => {
    const file = new File([blob], `KindlesMind_${diagCode}.png`, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: 'KindlesMind 靈魂原型診斷' })
        .catch(console.error).finally(() => setDownloading(false))
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `KindlesMind_${diagCode}.png`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    let blob = cachedBlob
    if (!blob) {
      try {
        if (!cardRef.current) { setDownloading(false); return }
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
        const res = await fetch(dataUrl)
        blob = await res.blob()
        setCachedBlob(blob)
      } catch (e) {
        console.error('圖片產生失敗', e)
        setDownloading(false)
        return
      }
    }
    doShare(blob)
  }

  const handleThreads = () => {
    const text = encodeURIComponent(
      `我在 KindlesMind 測出了「${profile.poeticName}」\n${profile.label} · ${profile.tag}\n\n去測測你是哪種靈魂原型 ✦ https://kindlesmind.com`
    )
    window.open(`https://www.threads.net/intent/post?text=${text}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="mt-6 space-y-5">

      {/* Hidden ShareCard for export */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <ShareCard profile={profile} dimData={dimData} radarData={radarData} diagCode={diagCode} cardRef={cardRef} />
      </div>

      {/* Section: Root Analysis */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Brain} color="#E8956A">深度根源分析</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-3">
          你的心靈地圖是如何形成的？
        </p>
        <p className="text-warm-text-muted text-base leading-loose whitespace-pre-line">
          {profile.rootAnalysis}
        </p>
      </div>

      {/* Section: Partner Decode */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Eye} color="#7B9EE8">對方的潛意識行為解讀</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-3">
          他的行為背後，藏著什麼？
        </p>
        <p className="text-warm-text-muted text-base leading-loose whitespace-pre-line">
          {profile.partnerDecode}
        </p>
      </div>

      {/* Section: Prescription */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Clock} color="#6B7CB5">療癒處方</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-5">
          接下來，你可以這樣做
        </p>
        <div className="space-y-5">
          {profile.prescription.map((month, i) => (
            <motion.div key={i}
              className="relative pl-5 border-l-2"
              style={{ borderColor: i === 0 ? '#D48C70' : i === 1 ? '#7B9EE8' : '#6B7CB5' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}>
              <div className="absolute -left-1.5 top-0.5 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: i === 0 ? '#D48C70' : i === 1 ? '#7B9EE8' : '#6B7CB5' }} />
              <p className="text-xs text-warm-text-muted mb-0.5">{month.month}</p>
              <p className="font-serif text-warm-text font-semibold mb-2">{month.title}</p>
              <ul className="space-y-1.5">
                {month.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-2 text-base text-warm-text-muted leading-relaxed">
                    <CheckCircle size={14} className="flex-shrink-0 mt-1 text-warm-sage" style={{ color: '#DC8DF3' }} />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Save code reminder (above share buttons) ── */}
      <motion.div
        className="mt-2 mb-4 rounded-2xl p-5"
        style={{ background: `linear-gradient(135deg, ${profile.accentColor}14, ${profile.accentColor}08)`, border: `1.5px solid ${profile.accentColor}40` }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-2">
          <BadgeCheck size={14} style={{ color: profile.accentColor }} />
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: profile.accentColor }}>
            保留你的診斷編碼
          </p>
        </div>
        <p className="font-mono font-bold text-2xl tracking-wider mb-2" style={{ color: profile.accentColor }}>
          {diagCode}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#7A6E95' }}>
          💡 請務必保留此編碼，未來可隨時回到首頁輸入查看完整報告。
        </p>
        <motion.button
          onClick={async () => {
            let ok = false
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(diagCode)
                ok = true
              }
            } catch { /* fall through to legacy */ }
            if (!ok) {
              // Fallback for iOS Safari / insecure contexts
              try {
                const ta = document.createElement('textarea')
                ta.value = diagCode
                ta.style.position = 'fixed'
                ta.style.opacity = '0'
                document.body.appendChild(ta)
                ta.focus(); ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
                ok = true
              } catch { /* give up silently */ }
            }
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
          }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium cursor-pointer select-none"
          style={{ background: '#FFFFFF', color: profile.accentColor, border: `1px solid ${profile.accentColor}40`, WebkitTapHighlightColor: 'transparent' }}>
          {codeCopied ? <><Check size={12} /> 已複製</> : <><Copy size={12} /> 複製編碼</>}
        </motion.button>
      </motion.div>

      {/* Footer note */}
      <div className="text-center py-4">
        <Leaf size={14} className="text-warm-terracotta mx-auto mb-2 opacity-60" />
        <p className="text-warm-text-light text-xs">
          KindlesMind 診斷報告 · 僅供個人參考，不替代專業臨床診療
        </p>
      </div>

      {/* Share / Download buttons */}
      <div className="flex gap-2.5 pb-2">
        <motion.button
          onClick={handleDownload}
          disabled={downloading}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
          style={{ background: 'rgba(220,141,243,0.1)', color: '#8B30C0', border: '1px solid rgba(220,141,243,0.25)' }}>
          {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          儲存圖片
        </motion.button>
        <motion.button
          onClick={handleThreads}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#1C1C1E', border: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Threads — Tabler Icons @-symbol (MIT) — stroke-based, no fill-rule issues */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4"/>
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
          </svg>
          分享到 Threads
        </motion.button>
      </div>
    </motion.div>
  )
}

function ResultScreen({ results, onUnlock, isUnlocked, onModal, onRetake }) {
  const { profile, dimData, diagCode, radarData } = results
  const videoRef = useRef(null)
  // 原型動畫是全畫面中最強的動態元素。使用者若已表明想減少動態效果，就不
  // 自動播放，改為給出播放控制項，讓他們自己決定。
  const prefersReducedMotion = useReducedMotion()

  // iOS Safari 在從外部頁面（Portaly 付款）回來後會失去 user gesture context，
  // muted+playsInline 的影片仍可能被擋。主動在 mount、可見性切換、profile 變更時呼叫 play()。
  // 但使用者若偏好減量動畫，這些補救一律不執行。
  useEffect(() => {
    if (prefersReducedMotion) return
    const v = videoRef.current
    if (!v) return
    const tryPlay = () => { v.play().catch(() => {}) }
    tryPlay()
    const onVisible = () => { if (!document.hidden) tryPlay() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', tryPlay)
    window.addEventListener('focus', tryPlay)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', tryPlay)
      window.removeEventListener('focus', tryPlay)
    }
  }, [profile.videoSrc, isUnlocked, prefersReducedMotion])

  return (
    <motion.div className="min-h-screen py-10 max-w-lg mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <motion.div className="px-5 text-center mb-7"
        initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: 'linear-gradient(135deg,rgba(220,141,243,0.12),rgba(51,171,211,0.10))', color: '#9B3FCC', border: '1px solid rgba(220,141,243,0.3)' }}>
            <Sparkles size={11} />
            診斷完成 · {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
          </div>
          {/* 診斷代碼 chip — 解鎖後才顯示 */}
          {isUnlocked && (
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono font-semibold tracking-wider"
              style={{ backgroundColor: profile.accentColor + '18', color: profile.accentColor, border: `1px solid ${profile.accentColor}30` }}>
              <BadgeCheck size={11} />
              {diagCode}
            </div>
          )}
        </div>
        <h2 className="font-serif text-2xl text-warm-text font-semibold mb-1">你的靈魂頻率診斷</h2>
        <p className="text-warm-text-muted text-sm">以下是根據你的 28 道情境題繪製的靈魂地圖</p>
      </motion.div>

      {/* SoulMap card */}
      <div className="px-5">
      <motion.div className="bg-white overflow-hidden rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 mb-5"
        initial={{ opacity: 1, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>

        {/* ── Video cover ── */}
        <video
          ref={videoRef}
          key={profile.videoSrc}
          src={profile.videoSrc}
          autoPlay={!prefersReducedMotion}
          loop={!prefersReducedMotion}
          controls={prefersReducedMotion}
          muted playsInline
          preload="metadata"
          webkit-playsinline="true"
          x5-playsinline="true"
          className="w-full"
          onLoadedMetadata={(e) => { if (!prefersReducedMotion) e.currentTarget.play().catch(() => {}) }}
          onLoadedData={(e) => { if (!prefersReducedMotion) e.currentTarget.play().catch(() => {}) }}
          onCanPlay={(e) => { if (!prefersReducedMotion) e.currentTarget.play().catch(() => {}) }}
          onPause={(e) => {
            // 防止 iOS Safari 在外部頁面回來後自動暫停；減量動畫下不干預使用者的暫停
            if (!prefersReducedMotion && !document.hidden) e.currentTarget.play().catch(() => {})
          }}
          style={{
            objectFit: 'cover',
            display: 'block',
            aspectRatio: '16/9',
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem',
            transform: 'translateZ(0)', // iOS Safari 強制 GPU 合成，確保圓角生效
          }}
        />

        {/* ── Card body ── */}
        <div>
          <div className="px-6 pb-6 pt-5">
            <p className="text-warm-text-muted text-xs tracking-widest uppercase mb-1">靈魂原色地圖</p>
            <motion.p className="font-serif text-2xl font-bold leading-tight mb-1"
              style={{ color: profile.accentColor }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
              {profile.label}
            </motion.p>
            <p className="text-warm-text-muted text-sm mb-5">{profile.tag}</p>

            <p className="text-warm-text-muted text-base leading-relaxed bg-warm-cream/80 rounded-2xl p-4 border border-warm-cream-dark/30 mb-5">
              {profile.summary}
            </p>

            {/* Free insight pill */}
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
              style={{ backgroundColor: 'rgba(220,141,243,0.06)', borderColor: 'rgba(220,141,243,0.18)' }}>
              <Eye size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#DC8DF3' }} />
              <p className="text-base text-warm-text-muted leading-relaxed">
                <span className="font-semibold text-warm-text">初步觀測：</span>{profile.freeInsight}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      </div>

      <div className="px-5">
      {/* Archetype card */}
      <motion.div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6 mb-5"
        initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-xs text-warm-text-muted tracking-widest uppercase mb-4">你的靈魂原型</p>
        <div className="flex items-start gap-4">
          <motion.div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-warm-sm border"
            style={{ backgroundColor: profile.tagBg, borderColor: profile.tagBorder }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            {profile.emoji}
          </motion.div>
          <div>
            <p className="font-serif text-xl text-warm-text font-semibold leading-tight mb-1.5">{profile.archetype}</p>
            <p className="text-warm-text-muted text-base leading-relaxed italic">{profile.archetypeDesc}</p>
          </div>
        </div>
      </motion.div>

      {/* Soul paradox card */}
      <motion.div className="rounded-3xl border p-6 mb-5"
        style={{ background: 'linear-gradient(135deg, #F5F0FA 0%, #EDE8F5 100%)', borderColor: 'rgba(155,126,166,0.25)' }}
        initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} style={{ color: '#9B7EA6' }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9B7EA6' }}>靈魂矛盾</p>
        </div>
        <p className="text-warm-text text-base leading-loose">{profile.soulParadox}</p>
      </motion.div>

      {/* ── 四維靈魂場域評估 — Radar + Bars ── */}
      <motion.div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6 mb-5"
        initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <p className="text-xs text-warm-text-muted tracking-widest uppercase mb-4">四維靈魂場域評估</p>

        {/* Radar chart + bars side-by-side on wider screens */}
        <div className="flex flex-col gap-5 mb-1">
          {/* Radar chart */}
          <div style={{ margin: '0 -8px' }}>
            <RadarChart radarData={radarData} />
          </div>
          {/* Dim bars — use radarData.pct so numbers match radar labels */}
          <div className="flex-1 min-w-0">
            {dimData.map((d, i) => (
              <DimBar key={d.id} dim={d} pct={radarData[i]?.pct ?? d.pct} delay={0.45 + i * 0.1} text={getDimText(d.id, d.health)} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 療癒處方預覽（免費首月，解鎖後隱藏）── */}
      {!isUnlocked && <motion.div className="rounded-3xl border p-6 mb-5 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #F9F6FF 0%, #F1EDF8 100%)', borderColor: 'rgba(155,126,166,0.2)' }}
        initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>

        {/* Header — matches FullReport style */}
        <SectionLabel icon={Clock} color="#6B7CB5">療癒處方</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-5">
          接下來，你可以這樣做
        </p>

        {/* Timeline — Month 1 fully visible */}
        <div className="space-y-5">
          <div className="relative pl-5 border-l-2" style={{ borderColor: '#D48C70' }}>
            <div className="absolute -left-1.5 top-0.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D48C70' }} />
            <p className="text-xs text-warm-text-muted mb-0.5">第一個月</p>
            <p className="font-serif text-warm-text font-semibold mb-2">{profile.prescription[0].title}</p>
            <ul className="space-y-1.5">
              {profile.prescription[0].steps.map((s, j) => (
                <li key={j} className="flex items-start gap-2 text-base text-warm-text-muted leading-relaxed">
                  <CheckCircle size={14} className="flex-shrink-0 mt-1" style={{ color: '#DC8DF3' }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Month 2 — partially visible, fading out */}
          <div className="relative" style={{ maxHeight: 105, overflow: 'clip', overflowX: 'visible' }}>
            <div className="relative pl-5 border-l-2" style={{ borderColor: '#7B9EE8', userSelect: 'none', pointerEvents: 'none' }}>
              <div className="absolute -left-1.5 top-0.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7B9EE8' }} />
              <p className="text-xs text-warm-text-muted mb-0.5">{profile.prescription[1].month}</p>
              <p className="font-serif text-warm-text font-semibold mb-2">{profile.prescription[1].title}</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-base text-warm-text-muted leading-relaxed">
                  <CheckCircle size={14} className="flex-shrink-0 mt-1" style={{ color: '#DC8DF3' }} />
                  {profile.prescription[1].steps[0]}
                </li>
              </ul>
            </div>
            {/* Seamless fade to card background */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(241,237,248,0.5) 40%, rgba(241,237,248,1) 80%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Lock hint */}
          <div className="flex flex-col items-center gap-1 -mt-2 pb-1">
            <Lock size={13} style={{ color: '#6B7CB5' }} />
            <span className="text-[11px] font-medium" style={{ color: '#6B7CB5' }}>解鎖完整療癒處方</span>
          </div>
        </div>

        {/* Month badges */}
        <div className="flex gap-2 mt-5">
          {profile.prescription.map((m, i) => (
            <div key={i} className="flex-1 rounded-xl py-2 text-center text-[10px] font-semibold"
              style={{
                backgroundColor: i === 0 ? '#D48C70' + '20' : '#F0ECF8',
                color: i === 0 ? '#D48C70' : '#B0A8C8',
                border: `1px solid ${i === 0 ? '#D48C70' + '30' : '#E0D8F0'}`,
              }}>
              {i === 0 ? '✓ ' : '🔒 '}{m.month}
            </div>
          ))}
        </div>
      </motion.div>}

      {/* ── LOCKED SECTION ── */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div key="locked"
            initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            exit={{ opacity: 0 }}>

            {/* ── Purchase card ── */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-warm-lg relative"
              style={{ border: '1px solid rgba(196,184,228,0.45)' }}>

              {/* Early-bird badge */}
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold z-10"
                style={{ background: 'linear-gradient(135deg,#FFB572,#FF8A8A)', color: '#FFFFFF' }}>
                <span>🔥</span> 早鳥限時
              </div>

              {/* ── Header + value prop ── */}
              <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(196,184,228,0.25)' }}>
                <p className="text-sm tracking-widest uppercase mb-3" style={{ color: '#B0A0C8' }}>完整診斷報告</p>
                <p className="font-serif font-bold text-warm-text text-2xl leading-tight mb-3">
                  看見你在愛中真實的樣貌
                </p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#7A6E95' }}>
                  3,500+ 字深度解析 × 3 個月重建指南，<br />
                  讓模糊的感受，變成清楚的行動。
                </p>

                {/* Psychologist endorsement */}
                <div className="mb-5 rounded-xl p-4"
                  style={{ background: '#F9F7FD', border: '1px solid rgba(196,184,228,0.35)' }}>
                  <p className="text-sm font-medium mb-3" style={{ color: '#B0A0C8', letterSpacing: '0.08em' }}>心理師推薦序</p>
                  <div className="flex items-start gap-3">
                    <img src="/psychologist2.jpg" alt="葉信儂"
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"
                      style={{ border: '1.5px solid rgba(155,126,166,0.25)' }} />
                    <div>
                      <p className="text-sm leading-relaxed italic mb-2" style={{ color: '#6B5F8A' }}>
                        「我推薦這份測驗給想更了解自己依附模式的人，它能幫你看見關係中未察覺的盲點。」
                      </p>
                      <p className="text-sm font-medium" style={{ color: '#9A94B8' }}>— 葉信儂，諮商心理師</p>
                    </div>
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm line-through" style={{ color: '#C0B8D0' }}>NT$1,200</span>
                      <span className="text-sm font-semibold" style={{ color: '#E8956A' }}>省 67%</span>
                    </div>
                    <p className="font-bold text-2xl leading-none" style={{ color: '#2E2150' }}>NT$399</p>
                  </div>
                  <motion.a
                    href={(() => {
                      const params = new URLSearchParams(window.location.search)
                      params.set('u', '1')
                      const returnUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
                      return `https://portaly.cc/kindlesmind/product/fgqHt0NJ9DokyCZ0zayS?next=${encodeURIComponent(returnUrl)}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-2xl font-semibold text-sm no-underline whitespace-nowrap flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg,#DC8DF3,#33ABD3)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(220,141,243,0.35)' }}
                    onClick={() => { track('unlock_click') }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}>
                    立即解鎖 <ArrowRight size={14} />
                  </motion.a>
                </div>
              </div>

              {/* ── Unlock items ── */}
              <div className="px-6 py-5">
                <p className="text-sm font-semibold text-warm-text mb-4">你將獲得</p>
                <div className="space-y-5">
                  {[
                    { icon: '📄', title: '依附類型個人化深度解析', sub: '讀懂你在關係中的核心劇本，3,500+ 字完整報告' },
                    { icon: '📋', title: '3 個月情感安全感重建指南', sub: '每月具體步驟，從無意識循環走向安全依附' },
                    { icon: '🔗', title: '專業心理師顧問聯繫方式', sub: '需要進一步支持時，有專業資源可用' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#F2F0FA' }}>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-warm-text leading-snug">{item.title}</p>
                        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#9A94B8' }}>{item.sub}</p>
                      </div>
                      <CheckCircle size={16} className="flex-shrink-0 mt-1" style={{ color: '#DC8DF3' }} />
                    </div>
                  ))}
                </div>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid rgba(196,184,228,0.3)' }}>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#9A94B8' }}>
                    <Shield size={11} /> 匿名保護
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#9A94B8' }}>
                    <Zap size={11} /> 付款即解鎖
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#9A94B8' }}>
                    <BadgeCheck size={11} /> 終身查看
                  </div>
                </div>
              </div>

            </div>

          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FullReport profile={profile} dimData={dimData} diagCode={diagCode} radarData={radarData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Retake button ── */}
      <motion.div
        className="text-center pt-2 pb-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <motion.button
          onClick={onRetake}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ backgroundColor: '#EBE6F8', color: '#7A70A0', border: '1px solid rgba(196,184,228,0.6)' }}
          whileHover={{ scale: 1.03, backgroundColor: '#E0D8F4' }}
          whileTap={{ scale: 0.97 }}>
          <RefreshCw size={13} />
          重新測驗
        </motion.button>
      </motion.div>

      </div>{/* end px-5 wrapper */}
    </motion.div>
  )
}

// ─── ECPAY MODAL ──────────────────────────────────────────────────────────────

function EcpayModal({ onClose, onSuccess, email }) {
  // steps: init → redirecting → ecpay → success
  const [step, setStep] = useState('init')
  const [tradeNo] = useState(generateTradeNo)
  const [tradeDate] = useState(() => formatTradeDate())

  useEffect(() => {
    const t1 = setTimeout(() => setStep('redirecting'), 1400)
    const t2 = setTimeout(() => setStep('ecpay'), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleSimPay = () => {
    setStep('success')
    setTimeout(() => { onSuccess(); onClose() }, 2200)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      {/* Backdrop — only closeable before ecpay step */}
      <motion.div className="absolute inset-0"
        style={{ backgroundColor: 'rgba(67,66,66,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={step === 'ecpay' ? undefined : onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

      <motion.div className="relative w-full max-w-sm mx-4 overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

        <AnimatePresence mode="wait">

          {/* ── Step 1: init – 準備交易參數 ── */}
          {step === 'init' && (
            <motion.div key="init"
              className="bg-white rounded-3xl shadow-warm-xl overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              <div className="px-6 pt-6 pb-5">
                <button onClick={onClose}
                  aria-label="關閉"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center text-warm-text-muted hover:bg-warm-cream-dark transition-colors">
                  <X size={14} />
                </button>
                {/* ECPay brand strip */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-7 px-3 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)', letterSpacing: '0.05em' }}>
                    綠界科技 ECPay
                  </div>
                  <span className="text-warm-text-light text-xs">安全金流跳轉中</span>
                </div>

                <p className="font-serif text-warm-text font-semibold mb-4">正在產生交易憑證…</p>

                {/* Trade params table */}
                <div className="bg-warm-cream rounded-2xl p-4 space-y-2.5 border border-warm-cream-dark/40 text-xs mb-4">
                  {[
                    { key: 'MerchantID',         val: ECPAY_PARAMS.MerchantID },
                    { key: 'MerchantTradeNo',     val: tradeNo },
                    { key: 'MerchantTradeDate',   val: tradeDate },
                    { key: 'TotalAmount',         val: `NT$ ${ECPAY_PARAMS.TotalAmount}` },
                    { key: 'ItemName',            val: ECPAY_PARAMS.ItemName },
                    { key: 'ChoosePayment',       val: '信用卡 / ATM / 超商代碼' },
                  ].map(({ key, val }) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-warm-text-muted font-mono flex-shrink-0">{key}</span>
                      <span className="text-warm-text font-medium text-right break-all">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-warm-text-muted text-xs">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={11} />
                  </motion.div>
                  使用 SHA256 雜湊加密，準備跳轉至綠界支付頁面…
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: redirecting ── */}
          {step === 'redirecting' && (
            <motion.div key="redirecting"
              className="bg-white rounded-3xl shadow-warm-xl py-16 px-6 flex flex-col items-center text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Animated lock → arrow */}
              <div className="relative mb-6">
                {[140, 100, 64].map((size, i) => (
                  <motion.div key={i} className="absolute rounded-full"
                    style={{
                      width: size, height: size, left: -size / 2, top: -size / 2,
                      border: i < 2 ? `1.5px solid rgba(0,166,80,${0.1 + i * 0.08})` : undefined,
                      background: i === 2 ? 'linear-gradient(135deg,#00A650,#007A3D)' : undefined,
                    }}
                    animate={{ scale: [1, 1.08 + i * 0.04, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-warm-lg"
                  style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}>
                  <Shield size={26} className="text-white" />
                </div>
              </div>
              <div className="h-7 px-3 rounded-md inline-flex items-center justify-center text-white text-xs font-bold mb-4"
                style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}>
                綠界科技 ECPay
              </div>
              <p className="font-serif text-warm-text text-xl font-semibold mb-2">
                正在安全跳轉至綠界支付系統…
              </p>
              <p className="text-warm-text-muted text-sm leading-relaxed mb-6">
                請勿關閉視窗，我們正在建立加密連線
              </p>
              {/* Progress bar */}
              <div className="w-full max-w-xs h-1.5 bg-warm-cream-dark rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00A650, #5ece8a)' }}
                  initial={{ width: '10%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-warm-text-light text-xs mt-3">SSL 256-bit 加密保護中</p>
            </motion.div>
          )}

          {/* ── Step 3: ecpay – 模擬付款頁 ── */}
          {step === 'ecpay' && (
            <motion.div key="ecpay"
              className="bg-white rounded-3xl shadow-warm-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              {/* ECPay header bar */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-warm-cream-dark/30"
                style={{ background: 'linear-gradient(90deg,#00A650,#007A3D)' }}>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-white opacity-90" />
                  <span className="text-white text-sm font-bold tracking-wide">綠界科技 ECPay</span>
                </div>
                <span className="text-white/70 text-xs">🔒 安全付款</span>
              </div>

              <div className="px-6 py-5">
                {/* Order summary */}
                <div className="bg-warm-cream rounded-2xl p-4 mb-5 border border-warm-cream-dark/40">
                  <p className="text-xs text-warm-text-muted mb-0.5">訂單摘要</p>
                  <p className="font-serif text-warm-text font-semibold text-sm leading-snug mb-2">
                    {ECPAY_PARAMS.ItemName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-warm-text-muted text-xs">交易序號 {tradeNo}</span>
                    <div className="text-right">
                      <span className="text-warm-text-light text-xs line-through block">NT$980</span>
                      <span className="font-serif text-2xl font-bold text-warm-text">NT${ECPAY_PARAMS.TotalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method tabs */}
                <p className="text-xs text-warm-text-muted mb-3 font-medium">選擇付款方式</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: '信用卡', active: true },
                    { label: 'ATM 轉帳', active: false },
                    { label: '超商代碼', active: false },
                  ].map((tab, i) => (
                    <div key={i}
                      className="py-2.5 rounded-xl text-center text-xs font-medium border transition-all cursor-default"
                      style={tab.active
                        ? { background: 'rgba(0,166,80,0.1)', borderColor: '#00A650', color: '#007A3D' }
                        : { borderColor: '#E0D8F4', color: '#A898C8', backgroundColor: '#faf8fe' }}>
                      {tab.label}
                    </div>
                  ))}
                </div>

                {/* Simulated card input (display only) */}
                <div className="space-y-3 mb-5">
                  <div className="w-full px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">
                    **** **** **** ****
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">MM/YY</div>
                    <div className="px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">CVV</div>
                  </div>
                </div>

                {/* Pay button */}
                <motion.button
                  className="w-full py-4 rounded-2xl text-white font-bold text-base mb-3"
                  style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}
                  onClick={handleSimPay}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}>
                  確認付款 NT${ECPAY_PARAMS.TotalAmount}
                </motion.button>

                <p className="text-center text-warm-text-light text-xs">
                  ⚠️ 這是模擬測試環境，不會產生實際交易
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: success ── */}
          {step === 'success' && (
            <motion.div key="success"
              className="bg-white rounded-3xl shadow-warm-xl py-16 px-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-18 h-18 rounded-2xl flex items-center justify-center mb-5 shadow-warm-lg"
                style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#6B7CB5,#4A5A8C)' }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 280 }}>
                <BadgeCheck size={32} className="text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="font-serif text-warm-text text-2xl font-semibold mb-2">付款成功！</p>
                <p className="text-warm-text-muted text-sm mb-1">交易序號：{tradeNo}</p>
                <p className="text-warm-text-muted text-sm mb-4">你的靈魂處方箋正在解鎖，請稍候…</p>
                {email && (
                  <motion.div
                    className="flex items-start gap-2 rounded-2xl px-4 py-3 text-left max-w-xs mx-auto"
                    style={{ backgroundColor: '#6B7CB512', border: '1px solid #6B7CB528' }}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    <Mail size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#DC8DF3' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#5A6A5C' }}>
                      診斷報告已同步寄送至<br />
                      <strong className="font-medium">{email}</strong><br />
                      如未收到，請檢查垃圾郵件匣或聯繫團隊。
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── LEGAL PAGES ─────────────────────────────────────────────────────────────

function LegalPage({ title, onBack, children }) {
  return (
    <motion.div className="min-h-screen px-5 py-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35 }}>
      {/* Back nav */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-warm-text-muted text-sm hover:text-warm-text transition-colors mb-8">
        <ChevronLeft size={16} /> 返回 KindlesMind
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium mb-4"
          style={{ backgroundColor: '#D48C7018', color: '#D48C70', border: '1px solid #D48C7030' }}>
          <Leaf size={11} />
          KindlesMind 法律文件
        </div>
        <h1 className="font-serif text-3xl text-warm-text font-bold mb-2">{title}</h1>
        <p className="text-warm-text-muted text-sm">最後更新：2025 年 1 月 1 日</p>
      </div>

      {/* Content */}
      <div className="space-y-7 pb-16">
        {children}
      </div>
    </motion.div>
  )
}

function LegalSection({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm-sm p-6">
      <h2 className="font-serif text-warm-text font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-warm-terracotta flex-shrink-0" />
        {title}
      </h2>
      <div className="text-warm-text-muted text-sm leading-loose space-y-2">
        {children}
      </div>
    </div>
  )
}

function PrivacyPage({ onBack }) {
  return (
    <LegalPage title="隱私權政策" onBack={onBack}>
      <LegalSection title="我們重視你的隱私">
        <p>KindlesMind（以下稱「本服務」）深刻理解，你在完成這份測驗時所揭露的，是你內心最私密的情感狀態。因此，我們對隱私保護的承諾，不只是法律義務，更是我們對每一位使用者的道德責任。</p>
        <p>本政策說明我們如何收集、使用及保護你的個人資料。</p>
      </LegalSection>

      <LegalSection title="我們收集哪些資料">
        <p><strong className="text-warm-text">測驗回答資料：</strong>你在 KindlesMind 測驗中所選擇的答案，僅於你的瀏覽器本地端進行計算，用以生成你的個人化診斷結果。<strong className="text-warm-text">我們不會將你的答案傳輸至伺服器、不會儲存、也不會與任何第三方分享。</strong></p>
        <p><strong className="text-warm-text">支持與付款：</strong>若你選擇支持 KindlesMind，連結將導向 Portaly 頁面，由你自行完成支持流程。KindlesMind 不會接觸、儲存或傳輸任何付款資訊，所有金融資料由 Portaly 依其隱私政策處理。</p>
        <p><strong className="text-warm-text">技術日誌：</strong>我們可能收集匿名的技術資訊（如瀏覽器類型、造訪時間），用於系統穩定性分析。此類資料不含任何可識別個人身分的資訊。</p>
      </LegalSection>

      <LegalSection title="資料的匿名化處理">
        <p>KindlesMind 的核心設計原則是「最小資料收集」。你的測驗回答<strong className="text-warm-text">從不離開你的裝置</strong>——所有分析邏輯均在你的瀏覽器中本地執行，結果計算完成後不會上傳至任何伺服器。</p>
        <p>這意味著即使是我們的開發團隊，也無法得知你回答了什麼、得到了哪種診斷結果。你的情感私密，由你自己完全掌控。</p>
      </LegalSection>

      <LegalSection title="第三方服務">
        <p>本服務目前使用以下第三方服務：</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-warm-text">Portaly</strong>：提供支持頁面連結服務</li>
          <li><strong className="text-warm-text">Google Fonts</strong>：提供字型資源（Noto Serif TC、Noto Sans TC）</li>
        </ul>
        <p>上述第三方服務各有其獨立的隱私政策，我們建議你自行查閱。</p>
      </LegalSection>

      <LegalSection title="Cookie 政策">
        <p>KindlesMind 目前不使用追蹤性 Cookie。我們僅使用瀏覽器本地儲存（localStorage）暫存你的測驗進度，以防止意外中斷造成資料遺失。此資料不會被傳輸至任何伺服器，你可以隨時透過清除瀏覽器資料將其刪除。</p>
      </LegalSection>

    </LegalPage>
  )
}

function TermsPage({ onBack }) {
  return (
    <LegalPage title="服務條款" onBack={onBack}>
      <LegalSection title="服務性質說明">
        <p>KindlesMind 提供基於心理學研究的線上關係溫度診斷服務。本測驗由 KindlesMind 心理師團隊研發，旨在協助使用者更深入了解自身的依附模式與情感狀態。</p>
        <p><strong className="text-warm-text">重要聲明：</strong>KindlesMind 提供的所有診斷結果、分析報告及建議內容，均僅供個人參考，<strong className="text-warm-text">不構成任何形式的醫療診斷、心理治療或專業臨床服務。</strong>若你有嚴重的心理健康需求，請尋求具執照的心理師或精神科醫師的協助。</p>
      </LegalSection>

      <LegalSection title="數位商品與付款">
        <p>KindlesMind 完整診斷報告屬於<strong className="text-warm-text">數位內容服務</strong>，購買後將即時提供全文閱覽。</p>
        <p><strong className="text-warm-text">關於退款政策：</strong>依據《消費者保護法》第 19 條第 1 項但書規定，提供非以有形媒介提供之數位內容，且經消費者事先同意始提供者，不適用七日猶豫期之規定。</p>
        <p>購買前，你將有機會預覽報告的目錄架構與部分免費內容，以充分評估是否適合你的需求。我們鼓勵你在充分考慮後再行購買。</p>
        <p>若因系統錯誤導致付款成功但無法存取報告內容，請於 7 個工作天內聯繫我們，我們將提供技術支援或全額退款。</p>
      </LegalSection>

      <LegalSection title="智慧財產權">
        <p>KindlesMind 平台上的所有內容，包括但不限於測驗題目、診斷架構、分析文字、靈魂原型描述、療癒處方箋等，均為 KindlesMind 之原創作品，受著作權法保護。</p>
        <p>你購買的完整報告授權你個人閱覽使用，<strong className="text-warm-text">未經書面授權，不得轉載、重製、販售或以任何形式散布。</strong></p>
      </LegalSection>

      <LegalSection title="使用規範">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>請誠實、真實地回答測驗問題，以獲得最準確的診斷結果</li>
          <li>禁止將本平台用於任何非法、侵害他人權益或騷擾他人的目的</li>
          <li>禁止以自動化程式（bot）大量存取本服務</li>
          <li>KindlesMind 保留在不另行通知的情況下修改服務內容的權利</li>
        </ul>
      </LegalSection>

      <LegalSection title="免責聲明">
        <p>本服務依「現狀」提供，KindlesMind 不對任何因使用本服務而產生的間接損失負責。測驗結果基於統計學模型，不代表對個人情況的絕對判斷。人心複雜，任何心理測驗都無法完全涵蓋你的全部。</p>
      </LegalSection>

    </LegalPage>
  )
}

function AboutPage({ onBack }) {
  return (
    <LegalPage title="關於我們" onBack={onBack}>
      {/* Brand card */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm-lg p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-terracotta"
          style={{ background: 'linear-gradient(135deg, #9B7EA6, #7B5E8A)' }}>
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="font-serif text-2xl text-warm-text font-bold mb-1">KindlesMind</h2>
        <p className="text-warm-text-muted text-sm tracking-widest uppercase mb-4">Soul Frequency Diagnosis</p>
        <p className="text-warm-text-muted text-sm leading-relaxed max-w-sm mx-auto">
          KindlesMind 相信，每一份不安的背後，都藏著一個渴望被好好理解的靈魂。我們用心理學的語言，為你的情感狀態點一盞燈。
        </p>
      </div>

      <LegalSection title="我們是誰">
        <p>KindlesMind 由一群對心理學與科技充滿熱情的創作者所建立，致力於讓心理健康的資源更普及、更溫暖、更易於取用。</p>
        <p>我們的測驗框架以依附理論（Attachment Theory）、認知行為治療（CBT）及情緒聚焦治療（EFT）為理論基礎。</p>
      </LegalSection>

      <LegalSection title="我們的使命">
        <p>在這個時代，有太多人在關係中感到孤獨和不被理解，卻沒有機會或資源去尋求專業協助。KindlesMind 希望成為那座橋——</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>讓你能夠以一個安全、匿名的方式，誠實面對自己的情感狀態</li>
          <li>提供有科學根據、有溫度的個人化洞察</li>
          <li>引導有需要的人，找到合適的後續支持資源</li>
        </ul>
      </LegalSection>

      <LegalSection title="版本資訊">
        <p className="text-warm-text-light text-xs">
          KindlesMind v2.0<br />
          © 2026 uiuxtogether 科技鴨鴨 All Rights Reserved.
        </p>
      </LegalSection>
    </LegalPage>
  )
}

// ─── LEGAL MODAL ─────────────────────────────────────────────────────────────

function LegalModal({ modalKey, onClose }) {
  const MODAL_CONTENT = {
    terms: {
      title: '服務條款',
      sections: [
        {
          title: '服務性質說明',
          body: 'KindlesMind 提供基於心理學研究的線上關係溫度診斷服務，旨在協助使用者了解自身的依附模式。診斷結果僅供個人參考，不構成任何形式的醫療診斷或臨床建議。',
        },
        {
          title: '數位商品與付款',
          body: null,
          items: [
            'KindlesMind 完整診斷報告屬於數位內容服務，購買後將即時提供全文閱覽。',
            '⚠️ 依據《消費者保護法》第 19 條第 1 項但書規定，非以有形媒介提供之數位內容，且經消費者事先同意始提供者，不適用七日猶豫期（7 天鑑賞期）之規定。',
            '若因系統錯誤導致付款成功但無法存取報告，請於 7 個工作天內來信 support@kindlesmind.com，我們將提供技術支援或全額退款。',
          ],
        },
        {
          title: '智慧財產權',
          body: '平台上所有測驗題目、診斷架構、分析文字均為 KindlesMind 原創作品，受著作權法保護。購買後授權個人閱覽，未經書面授權不得轉載或商業使用。',
        },
      ],
    },
    privacy: {
      title: '隱私政策',
      sections: [
        {
          title: '資料收集',
          body: '我們收集的資料僅包含：測驗回答（匿名處理）、您自願提供的 Email（用於寄送報告），以及基本的頁面瀏覽記錄（透過 Google Analytics）。',
        },
        {
          title: '資料使用目的',
          body: '您的 Email 地址僅用於寄送診斷報告，不會用於行銷或轉售給任何第三方。',
        },
        {
          title: '支持方式說明',
          body: '支持連結將導向 Portaly 頁面，由你自行選擇支持金額。KindlesMind 不會接觸、儲存或傳輸任何付款資訊。',
        },
        {
          title: 'Cookie 政策',
          body: '我們不使用追蹤性 Cookie。僅使用 localStorage 暫存測驗進度，此資料不會傳輸至任何伺服器，您可隨時清除。',
        },
      ],
    },
    disclaimer: {
      title: '免責聲明',
      sections: [
        {
          title: '非醫療聲明',
          body: 'KindlesMind 所提供的所有診斷結果、分析報告及建議內容，均僅供個人參考，不構成任何形式的醫療診斷、心理治療或專業臨床服務建議。本測驗不能取代具執照的心理師或精神科醫師的專業評估。',
        },
        {
          title: '若您需要專業協助',
          body: '若您有嚴重的心理健康困擾，請尋求具執照的心理師或精神科醫師協助。台灣心理健康諮詢專線：1925（安心專線，24 小時免費）。',
        },
        {
          title: '結果準確性',
          body: '測驗結果基於統計學模型與自我報告，可能因當下情緒狀態或填答方式而有所差異。KindlesMind 不對因使用本服務而產生的任何間接損失負責。',
        },
      ],
    },
  }

  const content = MODAL_CONTENT[modalKey]
  if (!content) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(67,66,66,0.48)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        className="w-full max-w-lg overflow-hidden"
        style={{ backgroundColor: '#FDF8F5', borderRadius: '28px 28px 0 0', maxHeight: '82vh' }}
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: '#D4C5BC' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <h3 className="font-serif text-warm-text text-xl font-semibold">{content.title}</h3>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#E0D8F460', color: '#9A8E8B' }}>
            <X size={16} />
          </button>
        </div>
        <div className="mx-6 h-px" style={{ backgroundColor: '#E0D8F4' }} />

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(82vh - 88px)' }}>
          {content.sections.map((sec, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#D48C70' }}>{sec.title}</p>
              {sec.body && <p className="text-sm leading-relaxed text-warm-text-muted">{sec.body}</p>}
              {sec.items && (
                <ul className="space-y-2">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm leading-relaxed text-warm-text-muted">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full mt-2" style={{ backgroundColor: '#D48C70' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {/* Bottom padding for safe area */}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer({ onNav, onModal }) {
  const [copiedKey, setCopiedKey] = useState(null)
  const [showBizContact, setShowBizContact] = useState(false)

  const copyEmail = async (email) => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
        ok = true
      }
    } catch { /* fall through */ }
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = email
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus(); ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {}
    }
    setCopiedKey(email)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <footer className="border-t border-warm-cream-dark/40 mt-8 py-7 px-5">
      <div className="max-w-lg mx-auto">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo.png" alt="KindlesMind" className="w-6 h-6 rounded-md" />
          <span className="font-serif text-sm font-semibold text-warm-text">KindlesMind</span>
        </div>

        {/* Legal links — modal */}
        <nav aria-label="法律資訊" className="flex items-center justify-center gap-5 mb-4">
          {[
            { label: '服務條款',  key: 'terms'      },
            { label: '隱私政策',  key: 'privacy'    },
            { label: '免責聲明',  key: 'disclaimer' },
          ].map(({ label, key }) => (
            <button key={key}
              onClick={() => onModal(key)}
              className="text-warm-text-muted text-xs hover:text-warm-terracotta transition-colors">
              {label}
            </button>
          ))}
        </nav>

        {/* Contact */}
        <div className="flex items-center justify-center mb-2">
          <button
            onClick={() => copyEmail('support@kindlesmind.com')}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors hover:bg-warm-cream cursor-pointer"
            style={{ color: copiedKey === 'support@kindlesmind.com' ? '#4CAF82' : '#B4AACC' }}
            aria-label="複製 Email">
            {copiedKey === 'support@kindlesmind.com'
              ? <><Send size={11} /> 已複製</>
              : <><Mail size={11} /> support@kindlesmind.com</>}
          </button>
        </div>

        {/* Copyright — clickable to reveal business contact */}
        <button
          onClick={() => setShowBizContact(v => !v)}
          className="block mx-auto text-warm-text-light text-xs hover:text-warm-terracotta transition-colors cursor-pointer">
          © 2026 uiuxtogether 科技鴨鴨 All Rights Reserved.
        </button>

        {/* Business / collaboration contact — revealed on copyright click */}
        <AnimatePresence>
          {showBizContact && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center text-xs overflow-hidden"
              style={{ color: '#B4AACC' }}>
              <p className="mb-1.5">想製作類似的心理測驗？歡迎合作洽詢</p>
              <div className="inline-flex items-center gap-1.5">
                <a href="mailto:yaya.huang1116@gmail.com"
                  className="hover:text-warm-terracotta transition-colors underline"
                  style={{ color: '#9A94B8' }}>
                  yaya.huang1116@gmail.com
                </a>
                <button
                  onClick={() => copyEmail('yaya.huang1116@gmail.com')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:bg-warm-cream"
                  style={{ color: '#9A94B8' }}
                  aria-label="複製 Email">
                  {copiedKey === 'yaya.huang1116@gmail.com'
                    ? <><Check size={10} style={{ color: '#4CAF82' }} /> <span style={{ color: '#4CAF82' }}>已複製</span></>
                    : <><Copy size={10} /> <span>複製</span></>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </footer>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]           = useState('hero')
  const [results, setResults]       = useState(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [legalPage, setLegalPage]   = useState(null)  // null | 'privacy' | 'terms' | 'about'
  const [legalModal, setLegalModal] = useState(null)  // null | 'terms' | 'privacy' | 'disclaimer'

  // ── Restore result from URL or localStorage on first load ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlEncoded = params.get('a')

    const unlockFlag = params.get('u') === '1'
    let restored = false

    if (urlEncoded) {
      // Priority 1: URL params
      const answers = decodeAnswers(urlEncoded)
      if (answers) {
        setResults(calcResults(answers))
        setIsUnlocked(unlockFlag)
        setPhase('result')
        try { localStorage.setItem('km_last_result', JSON.stringify({ encoded: urlEncoded, unlocked: unlockFlag })) } catch {}
        restored = true
      }
    }

    // Priority 2: localStorage — also used when URL has invalid/missing answer data (e.g. Portaly redirect with ?a=xxxx)
    if (!restored) {
      try {
        const saved = JSON.parse(localStorage.getItem('km_last_result') || 'null')
        if (saved?.encoded) {
          const answers = decodeAnswers(saved.encoded)
          if (answers) {
            const unlocked = unlockFlag || saved.unlocked || false
            setResults(calcResults(answers))
            setIsUnlocked(unlocked)
            setPhase('result')
            window.history.replaceState(null, '', `?a=${saved.encoded}${unlocked ? '&u=1' : ''}`)
            if (unlocked && !saved.unlocked) {
              try { localStorage.setItem('km_last_result', JSON.stringify({ encoded: saved.encoded, unlocked: true })) } catch {}
            }
          }
        }
      } catch {}
    }
  }, [])

  const handleQuizComplete = (answers) => {
    setPhase('calculating')
    const encoded = encodeAnswers(answers)
    window.history.replaceState(null, '', `?a=${encoded}`)
    try { localStorage.setItem('km_last_result', JSON.stringify({ encoded, unlocked: false })) } catch {}
    const r = calcResults(answers)
    setTimeout(() => { setResults(r); setPhase('result'); track('quiz_complete') }, 3600)
  }

  const handleCodeResult = (parsed) => {
    setResults(parsed)
    setIsUnlocked(true)
    setPhase('result')
    window.scrollTo(0, 0)
  }
  const handleUnlock = () => {
    track('purchase_verified')
    setIsUnlocked(true)
    const params = new URLSearchParams(window.location.search)
    params.set('u', '1')
    window.history.replaceState(null, '', `?${params.toString()}`)
    try {
      const saved = JSON.parse(localStorage.getItem('km_last_result') || '{}')
      localStorage.setItem('km_last_result', JSON.stringify({ ...saved, unlocked: true }))
    } catch {}
  }
  const handleRetake = () => {
    setPhase('hero')
    setResults(null)
    setIsUnlocked(false)
    window.history.replaceState(null, '', window.location.pathname)
    try { localStorage.removeItem('km_last_result') } catch {}
    window.scrollTo(0, 0)
  }
  const handleNavLegal = (page) => { setLegalPage(page); window.scrollTo(0, 0) }
  const handleBackFromLegal = () => setLegalPage(null)

  const legalComponents = {
    privacy: PrivacyPage,
    terms:   TermsPage,
    about:   AboutPage,
  }

  return (
    // reducedMotion="user" 讓所有 motion 元件在使用者系統設定為「減少動態效果」
    // 時自動停用位移與縮放，只保留淡入淡出。
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: '#F4EEFF' }}>
      <NoiseOverlay />
      {/* Global ambient gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 15% 85%, rgba(220,141,243,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(51,171,211,0.08) 0%, transparent 55%)'
      }} />

      <main className="relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Legal pages ── */}
          {legalPage && (() => {
            const PageComp = legalComponents[legalPage]
            return (
              <motion.div key={`legal-${legalPage}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PageComp onBack={handleBackFromLegal} />
                <Footer onNav={handleNavLegal} onModal={setLegalModal} />
              </motion.div>
            )
          })()}

          {/* ── Main app flow ── */}
          {!legalPage && phase === 'hero' && (
            <motion.div key="hero" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
              <HeroScreen onStart={() => { track('quiz_start'); setPhase('quiz') }} onCode={handleCodeResult} />
              <Footer onNav={handleNavLegal} onModal={setLegalModal} />
            </motion.div>
          )}

          {!legalPage && phase === 'quiz' && (
            <motion.div key="quiz"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
              <QuizScreen onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {!legalPage && phase === 'calculating' && (
            <motion.div key="calculating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <CalculatingScreen />
            </motion.div>
          )}

          {!legalPage && phase === 'result' && results && (
            <motion.div key="result"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <ResultScreen
                results={results}
                onUnlock={handleUnlock}
                isUnlocked={isUnlocked}
                onModal={setLegalModal}
                onRetake={handleRetake}
              />
              <Footer onNav={handleNavLegal} onModal={setLegalModal} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>


      <AnimatePresence>
        {legalModal && (
          <LegalModal key={legalModal} modalKey={legalModal} onClose={() => setLegalModal(null)} />
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  )
}
