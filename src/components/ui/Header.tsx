import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { BuscaGlobal } from './BuscaGlobal'

export function Header() {
  const { online } = useStore()
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header id="app-header" style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background:'var(--s2)', borderBottom:'0.5px solid var(--borda)',
      maxWidth:'500px', margin:'0 auto',
      padding:'12px 16px 11px',
      display:'flex', justifyContent:'space-between', alignItems:'center',
      height:'var(--head-h)',
    }}>
      <div>
        <div style={{ fontSize:'20px', fontWeight:800, letterSpacing:'2px', lineHeight:1, color:'var(--txt)' }}>
          BOX <span style={{ color:'var(--verde)' }}>0.0</span>
        </div>
        <div style={{ fontSize:'9px', color:'var(--dim)', letterSpacing:'2px', textTransform:'uppercase', marginTop:'2px' }}>
          Estética Automotiva
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <div style={{ fontSize:'10px', fontWeight:600, color: online ? 'var(--verde)' : 'var(--dim)' }}>
          {online ? '● Online' : '● Offline'}
        </div>
        <BuscaGlobal />
        <button onClick={() => setDark(d => !d)} style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'20px', padding:'5px 9px', cursor:'pointer', fontSize:'14px', lineHeight:1 }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
