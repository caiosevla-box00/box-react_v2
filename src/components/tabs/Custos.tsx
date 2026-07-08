import React, { useState } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc } from '@/lib/firebase'
import { serverTimestamp } from 'firebase/firestore'

export function Custos() {
  const { custoPorKm, setCustoPorKm, toast_show } = useStore()
  const [gas, setGas] = useState('')
  const [consumo, setConsumo] = useState('')
  const [manut, setManut] = useState('')
  const [kmManut, setKmManut] = useState('')
  const [salvando, setSalvando] = useState(false)

  const gasN = Number(gas) || 0
  const consumoN = Number(consumo) || 0
  const manutN = Number(manut) || 0
  const kmManutN = Number(kmManut) || 1

  const custoCombustivel = consumoN > 0 ? gasN / consumoN : 0
  const custoManutencao = kmManutN > 0 ? manutN / kmManutN : 0
  const custoTotal = custoCombustivel + custoManutencao

  async function salvar() {
    if (custoTotal <= 0) { toast_show('⚠️ Preencha os valores'); return }
    setSalvando(true)
    setCustoPorKm(custoTotal)
    try {
      await setDoc(doc(db, COLS.config, 'main'), { custoPorKm: custoTotal, updatedAt: serverTimestamp() }, { merge: true })
      toast_show(`☁️ Custo/km: R$${custoTotal.toFixed(2)}`)
    } catch { toast_show(`💾 Salvo: R$${custoTotal.toFixed(2)}/km`) }
    setSalvando(false)
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg)', border:'1px solid var(--borda)', borderRadius:'var(--r)', padding:'11px 14px', color:'var(--txt)', outline:'none', fontSize:'16px' }
  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:'6px', marginTop:'14px' }

  return (
    <div>
      <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'6px' }}>Custo por km</div>
      <div style={{ fontSize:'13px', color:'var(--dim)', marginBottom:'20px' }}>Calcula seu custo real de deslocamento</div>

      {/* Custo atual */}
      {custoPorKm > 0 && (
        <div style={{ background:'var(--vbg)', border:'1px solid var(--verde)', borderRadius:'var(--r)', padding:'14px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:'13px', color:'var(--dim)' }}>Custo atual configurado</div>
          <div style={{ fontSize:'22px', fontWeight:700, color:'var(--verde)' }}>R${custoPorKm.toFixed(2)}/km</div>
        </div>
      )}

      {/* Combustível */}
      <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'10px' }}>
        <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'2px' }}>⛽ Combustível</div>
        <div style={{ fontSize:'12px', color:'var(--dim)', marginBottom:'10px' }}>Quanto você gasta por km rodado</div>
        <label style={lbl}>Preço do combustível (R$/litro)</label>
        <input type="number" value={gas} onChange={e => setGas(e.target.value)} placeholder="Ex: 6.50" style={inp} />
        <label style={lbl}>Consumo do veículo (km/litro)</label>
        <input type="number" value={consumo} onChange={e => setConsumo(e.target.value)} placeholder="Ex: 12" style={inp} />
        {custoCombustivel > 0 && (
          <div style={{ marginTop:'10px', fontSize:'13px', color:'var(--dim)' }}>
            Custo combustível: <span style={{ color:'var(--verde)', fontWeight:600 }}>R${custoCombustivel.toFixed(3)}/km</span>
          </div>
        )}
      </div>

      {/* Manutenção */}
      <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'10px' }}>
        <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'2px' }}>🔧 Manutenção</div>
        <div style={{ fontSize:'12px', color:'var(--dim)', marginBottom:'10px' }}>Diluído por km rodado</div>
        <label style={lbl}>Custo de manutenção (R$)</label>
        <input type="number" value={manut} onChange={e => setManut(e.target.value)} placeholder="Ex: 800" style={inp} />
        <label style={lbl}>A cada quantos km</label>
        <input type="number" value={kmManut} onChange={e => setKmManut(e.target.value)} placeholder="Ex: 10000" style={inp} />
        {custoManutencao > 0 && (
          <div style={{ marginTop:'10px', fontSize:'13px', color:'var(--dim)' }}>
            Custo manutenção: <span style={{ color:'var(--verde)', fontWeight:600 }}>R${custoManutencao.toFixed(3)}/km</span>
          </div>
        )}
      </div>

      {/* Total */}
      {custoTotal > 0 && (
        <div style={{ background:'var(--vbg)', border:'1px solid var(--verde)', borderRadius:'var(--r)', padding:'14px', marginBottom:'14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'14px', fontWeight:600 }}>Custo total por km</div>
            <div style={{ fontSize:'24px', fontWeight:800, color:'var(--verde)' }}>R${custoTotal.toFixed(2)}</div>
          </div>
          <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'4px' }}>
            No delivery: cobra +50% = <span style={{ color:'var(--verde)', fontWeight:600 }}>R${(custoTotal * 1.5).toFixed(2)}/km</span>
          </div>
        </div>
      )}

      <button onClick={salvar} disabled={salvando || custoTotal <= 0}
        style={{ width:'100%', padding:'14px', borderRadius:'var(--r)', background:custoTotal<=0?'var(--dim)':'var(--verde)', color:'#000', border:'none', fontSize:'14px', fontWeight:700, cursor:custoTotal<=0?'not-allowed':'pointer' }}>
        {salvando ? 'Salvando...' : '☁️ Salvar Custo/km'}
      </button>
    </div>
  )
}
