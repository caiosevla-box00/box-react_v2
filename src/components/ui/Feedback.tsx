import { useEffect } from 'react'
import { useStore } from '@/store'

export function Toast() {
  const { toast, toast_clear } = useStore()
  useEffect(() => { if (!toast) return; const t = setTimeout(toast_clear, 2600); return () => clearTimeout(t) }, [toast])
  if (!toast) return null
  return (
    <div style={{ position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', zIndex:99998, padding:'11px 20px', borderRadius:'20px', whiteSpace:'nowrap', background:'var(--vbg)', border:'1px solid var(--verde)', color:'var(--verde)', fontSize:'13px', fontWeight:600, letterSpacing:'.5px', animation:'fadeUp .2s ease' }}>
      {toast}
    </div>
  )
}

export function Loading() {
  const { loading } = useStore()
  if (!loading) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px' }}>
      <div style={{ width:90, height:90, borderRadius:'50%', background:'var(--vbg)', border:'2px solid var(--verde)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:'20px', animation:'pulseV 2s ease-in-out infinite' }}>
        <div style={{ fontSize:'22px', fontWeight:800, color:'var(--txt)', letterSpacing:'2px', lineHeight:1 }}>BOX</div>
        <div style={{ fontSize:'18px', fontWeight:800, color:'var(--verde)', lineHeight:1 }}>0.0</div>
      </div>
      <div style={{ fontSize:'11px', color:'var(--vdim)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'24px' }}>Carregando...</div>
      <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--verde)', animation:'pulseV 1s ease-in-out infinite' }} />
    </div>
  )
}
