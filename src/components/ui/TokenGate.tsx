import { useState, useEffect } from 'react'

const KEY = 'box00v2_token'
const TOKEN = 'BOX2903'
const EXPIRY = 7 * 24 * 60 * 60 * 1000

export function TokenGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  const [checking, setChecking] = useState(true)
  const [input, setInput] = useState('')
  const [erro, setErro] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) {
        const { token, ts } = JSON.parse(s)
        if (token === TOKEN && Date.now() - ts < EXPIRY) setOk(true)
      }
    } catch {}
    setChecking(false)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  if (checking) return null
  if (ok) return <>{children}</>

  function entrar() {
    if (input.trim().toUpperCase() === TOKEN) {
      localStorage.setItem(KEY, JSON.stringify({ token: TOKEN, ts: Date.now() }))
      setOk(true)
    } else {
      setErro(true)
      setInput('')
      setTimeout(() => setErro(false), 1800)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px' }}>
      {/* Logo */}
      <div style={{ width:96, height:96, borderRadius:'50%', background:'var(--vbg)', border:'2px solid var(--verde)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:'24px', animation:'pulseV 2s ease-in-out infinite' }}>
        <div style={{ fontSize:'26px', fontWeight:800, color:'var(--txt)', letterSpacing:'2px', lineHeight:1 }}>BOX</div>
        <div style={{ fontSize:'20px', fontWeight:800, color:'var(--verde)', lineHeight:1 }}>0.0</div>
      </div>

      <div style={{ fontSize:'20px', fontWeight:700, color:'var(--txt)', marginBottom:'4px' }}>BOX <span style={{ color:'var(--verde)' }}>0.0</span></div>
      <div style={{ fontSize:'11px', color:'var(--dim)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'36px' }}>Estética Automotiva</div>

      <div style={{ width:'100%', maxWidth:'280px' }}>
        <input
          type="password" value={input} autoFocus
          onChange={e => { setInput(e.target.value.toUpperCase()); setErro(false) }}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          placeholder="Código de acesso"
          style={{ width:'100%', background:'var(--s1)', border:`1.5px solid ${erro ? 'var(--erro)' : 'var(--borda)'}`, borderRadius:'var(--r)', padding:'13px 16px', color:'var(--txt)', fontSize:'18px', fontWeight:700, outline:'none', textAlign:'center', letterSpacing:'4px', marginBottom:'8px', transition:'border-color .2s' }}
        />
        {erro && <div style={{ fontSize:'12px', color:'var(--erro)', textAlign:'center', marginBottom:'8px' }}>Código incorreto</div>}
        <button onClick={entrar} style={{ width:'100%', background:'var(--verde)', color:'#000', fontSize:'14px', fontWeight:700, padding:'13px', borderRadius:'var(--r)', border:'none', cursor:'pointer', letterSpacing:'1px' }}>
          ENTRAR
        </button>
      </div>

      <button onClick={() => setDark(d => !d)} style={{ marginTop:'32px', background:'var(--s1)', border:'1px solid var(--borda)', borderRadius:'20px', padding:'6px 12px', cursor:'pointer', fontSize:'14px', color:'var(--txt)' }}>
        {dark ? '☀️ Modo claro' : '🌙 Modo escuro'}
      </button>
    </div>
  )
}
