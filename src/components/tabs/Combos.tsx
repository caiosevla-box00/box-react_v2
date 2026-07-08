import React, { useState } from 'react'
import { useStore } from '@/store'
import { SERVICOS, COMBOS } from '@/lib/servicos'

interface Props { onSelecionarCombo: (ids: string[]) => void }

export function Combos({ onSelecionarCombo }: Props) {
  const { veiculo, setVeiculo, precos } = useStore()
  const [sel, setSel] = useState<string | null>(null)

  const getP = (id: string) => precos[id]?.[veiculo] ?? SERVICOS.find(s => s.id === id)?.base[veiculo] ?? 0

  const TIPOS_V_L: Record<string,string> = { hatch:'🚗 Hatch', sedan:'🚙 Sedan', suv:'🛻 SUV' }
  const TAG_COR: Record<string,string> = {
    ESSENCIAL:'var(--verde)', PROTEÇÃO:'var(--azul)', FARÓIS:'var(--alerta)',
    PREMIUM:'#a29bfe', REFRESH:'#fd79a8', FULL:'var(--verde)',
  }

  return (
    <div>
      <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'6px' }}>Combos</div>
      <div style={{ fontSize:'13px', color:'var(--dim)', marginBottom:'16px' }}>Pacotes com serviços combinados</div>

      {/* Veículo */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:20 }}>
        {(['hatch','sedan','suv'] as const).map(v => (
          <button key={v} onClick={() => setVeiculo(v)} style={{ padding:'10px 4px', borderRadius:'var(--r)', fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:veiculo===v?'var(--verde)':'var(--s1)', color:veiculo===v?'#000':'var(--dim)', outline:veiculo===v?'none':'1px solid var(--borda)' }}>
            {TIPOS_V_L[v]}
          </button>
        ))}
      </div>

      {COMBOS.map(combo => {
        const total = combo.svcs.reduce((s, id) => s + getP(id), 0)
        const svcs = combo.svcs.map(id => SERVICOS.find(s => s.id === id)).filter(Boolean)
        const aberto = sel === combo.id
        const cor = TAG_COR[combo.tag] || 'var(--verde)'

        return (
          <div key={combo.id} style={{ background:'var(--s1)', border:`1.5px solid ${aberto ? cor : 'var(--borda)'}`, borderRadius:'var(--r)', marginBottom:'10px', overflow:'hidden', transition:'border-color .15s' }}>
            {/* Header */}
            <button onClick={() => setSel(aberto ? null : combo.id)}
              style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:`${cor}20`, color:cor, border:`1px solid ${cor}44` }}>{combo.tag}</span>
                </div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'var(--txt)' }}>{combo.nome}</div>
                <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'2px' }}>{combo.desc}</div>
              </div>
              <div style={{ textAlign:'right', marginLeft:'12px' }}>
                <div style={{ fontSize:'22px', fontWeight:800, color:cor }}>R${total}</div>
                <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'2px' }}>{combo.svcs.length} serviços</div>
                <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'4px' }}>{aberto ? '▲' : '▼'}</div>
              </div>
            </button>

            {/* Detalhe expandido */}
            {aberto && (
              <div style={{ borderTop:'1px solid var(--borda)', padding:'12px 14px 14px' }}>
                <div style={{ marginBottom:'12px' }}>
                  {svcs.map(s => (
                    <div key={s!.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid var(--borda)' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:600 }}>{s!.nome}</div>
                        <div style={{ fontSize:'11px', color:'var(--dim)' }}>{s!.tempo}</div>
                      </div>
                      <div style={{ fontSize:'14px', fontWeight:600, color:'var(--dim)' }}>R${getP(s!.id)}</div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'8px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600 }}>Total</span>
                    <span style={{ fontSize:'18px', fontWeight:800, color:cor }}>R${total}</span>
                  </div>
                </div>
                <button onClick={() => onSelecionarCombo(combo.svcs)}
                  style={{ width:'100%', padding:'13px', borderRadius:'var(--r)', background:cor, color: cor === 'var(--verde)' ? '#000' : '#fff', border:'none', fontSize:'14px', fontWeight:700, cursor:'pointer', letterSpacing:'0.5px' }}>
                  USAR ESTE COMBO →
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
