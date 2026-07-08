import React, { useState } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc } from '@/lib/firebase'
import { serverTimestamp } from 'firebase/firestore'
import { SERVICOS } from '@/lib/servicos'
import { gerarId, hoje } from '@/lib/utils'
import type { ServicoCustom } from '@/types'

const CATS_CUSTOM = ['Lavagens','Interior','Pintura','Polimento','Outros']

type Aba = 'precos' | 'servicos' | 'fundos'

export function Config() {
  const { precos, setPrecos, divisao, setDivisao, meta, setMeta, taxaDebito, servicosCustom, setServicosCustom, toast_show } = useStore()
  const [aba, setAba] = useState<Aba>('precos')
  const [salvando, setSalvando] = useState(false)

  // Preços local
  const [precosL, setPrecosL] = useState({ ...precos })
  const [metaL, setMetaL] = useState(String(meta || ''))
  const [divL, setDivL] = useState({ ...divisao })

  // Modal serviço custom
  const [modalSvc, setModalSvc] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ServicoCustom>({ id:'', nome:'', tempo:'', desc:'', hatch:0, sedan:0, suv:0, categoria:'Outros' })

  const totalDiv = divL.contas + divL.maquinas + divL.estoque + divL.lucro

  async function salvarConfig() {
    setSalvando(true)
    setPrecos(precosL)
    setDivisao(divL)
    setMeta(Number(metaL) || 0)
    try {
      await setDoc(doc(db, COLS.config, 'main'), {
        precos: precosL, divisao: divL, meta: Number(metaL) || 0,
        taxaDebito, servicosCustom, updatedAt: serverTimestamp()
      })
      toast_show('☁️ Configurações salvas!')
    } catch {
      toast_show('💾 Salvo localmente')
    }
    setSalvando(false)
  }

  async function salvarSvc() {
    if (!form.nome.trim()) { toast_show('⚠️ Nome obrigatório'); return }
    const svc = editId ? form : { ...form, id: gerarId() }
    const lista = editId ? servicosCustom.map(s => s.id === editId ? svc : s) : [...servicosCustom, svc]
    setServicosCustom(lista)
    setModalSvc(false)
    try {
      await setDoc(doc(db, COLS.config, 'main'), { servicosCustom: lista, updatedAt: serverTimestamp() }, { merge: true })
      toast_show('☁️ Serviço salvo!')
    } catch { toast_show('💾 Salvo localmente') }
  }

  async function excluirSvc(id: string) {
    if (!confirm('Excluir este serviço?')) return
    const lista = servicosCustom.filter(s => s.id !== id)
    setServicosCustom(lista)
    setModalSvc(false)
    try {
      await setDoc(doc(db, COLS.config, 'main'), { servicosCustom: lista, updatedAt: serverTimestamp() }, { merge: true })
      toast_show('🗑 Serviço removido')
    } catch { toast_show('💾 Salvo localmente') }
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg)', border:'1px solid var(--borda)', borderRadius:'var(--r)', padding:'10px 13px', color:'var(--txt)', outline:'none', fontSize:'15px' }
  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:'6px', marginTop:'12px' }

  return (
    <div>
      <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'16px' }}>Configurações</div>

      {/* Sub abas */}
      <div style={{ display:'flex', gap:'4px', background:'var(--s1)', padding:'4px', borderRadius:'var(--r)', marginBottom:'16px' }}>
        {(['precos','servicos','fundos'] as Aba[]).map(a => (
          <button key={a} onClick={() => setAba(a)} style={{ flex:1, padding:'9px 4px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, background:aba===a?'var(--verde)':'transparent', color:aba===a?'#000':'var(--dim)', transition:'all .15s' }}>
            {a==='precos'?'💰 Preços':a==='servicos'?'✨ Serviços':'📊 Fundos'}
          </button>
        ))}
      </div>

      {/* ── PREÇOS ── */}
      {aba === 'precos' && (
        <div>
          <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'6px', marginBottom:'8px' }}>
              {['Serviço','Hatch','Sedan','SUV'].map(h => (
                <div key={h} style={{ fontSize:'10px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', textAlign: h==='Serviço'?'left':'center' }}>{h}</div>
              ))}
            </div>
            {SERVICOS.map(s => (
              <div key={s.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
                <div style={{ fontSize:'12px', color:'var(--txt2)', lineHeight:1.3 }}>{s.nome}</div>
                {(['hatch','sedan','suv'] as const).map(v => (
                  <input key={v} type="number"
                    value={precosL[s.id]?.[v] ?? s.base[v]}
                    onChange={e => setPrecosL(p => ({ ...p, [s.id]: { ...p[s.id], [v]: Number(e.target.value) } }))}
                    style={{ background:'var(--bg)', border:'1px solid var(--borda)', borderRadius:'8px', padding:'7px 4px', color:'var(--verde)', fontSize:'13px', fontWeight:700, outline:'none', textAlign:'center', width:'100%' }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={lbl}>Meta mensal (R$)</label>
            <input type="number" value={metaL} onChange={e => setMetaL(e.target.value)} placeholder="Ex: 3000" style={inp} />
          </div>
          <button onClick={salvarConfig} disabled={salvando} style={{ width:'100%', padding:'14px', borderRadius:'var(--r)', background:salvando?'var(--dim)':'var(--verde)', color:'#000', border:'none', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
            {salvando ? 'Salvando...' : '☁️ Salvar Configurações'}
          </button>
        </div>
      )}

      {/* ── SERVIÇOS CUSTOM ── */}
      {aba === 'servicos' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'15px', fontWeight:600 }}>Meus Serviços</div>
              <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'2px' }}>Serviços além dos padrão</div>
            </div>
            <button onClick={() => { setForm({ id:'', nome:'', tempo:'', desc:'', hatch:0, sedan:0, suv:0, categoria:'Outros' }); setEditId(null); setModalSvc(true) }}
              style={{ background:'var(--verde)', color:'#000', fontSize:'13px', fontWeight:700, padding:'9px 16px', borderRadius:'20px', border:'none', cursor:'pointer' }}>
              + Novo
            </button>
          </div>

          {servicosCustom.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', background:'var(--s1)', borderRadius:'var(--r)', border:'1px dashed var(--borda)' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>✨</div>
              <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'6px' }}>Nenhum serviço personalizado</div>
              <div style={{ fontSize:'13px', color:'var(--dim)' }}>Crie serviços específicos do seu negócio — aparecem no orçamento.</div>
            </div>
          ) : servicosCustom.map(s => (
            <div key={s.id} onClick={() => { setForm({ ...s }); setEditId(s.id); setModalSvc(true) }}
              style={{ background:'var(--s1)', border:'1px solid var(--verde)', borderRadius:'var(--r)', padding:'14px', marginBottom:'8px', cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:600 }}>{s.nome}</div>
                  <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'3px' }}>{s.tempo} · {s.categoria}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'16px', fontWeight:700, color:'var(--verde)' }}>R${s.hatch}</div>
                  <div style={{ fontSize:'10px', color:'var(--dim)' }}>Hatch</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FUNDOS ── */}
      {aba === 'fundos' && (
        <div>
          <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', color:totalDiv!==100?'var(--erro)':'var(--dim)', fontWeight:600, marginBottom:'14px' }}>
              Total: {totalDiv}% {totalDiv!==100?'⚠️ Deve ser 100%':'✓'}
            </div>
            {([
              { label:'🏠 Contas Fixas', key:'contas'   as const, cor:'var(--azul)'  },
              { label:'🔧 Máquinas',     key:'maquinas' as const, cor:'#a29bfe'      },
              { label:'🧴 Estoque',      key:'estoque'  as const, cor:'#fd79a8'      },
              { label:'💰 Lucro Real',   key:'lucro'    as const, cor:'var(--verde)' },
            ]).map(f => (
              <div key={f.key} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                <div style={{ flex:1, fontSize:'14px', fontWeight:500 }}>{f.label}</div>
                <input type="number" value={divL[f.key]}
                  onChange={e => setDivL(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                  style={{ width:'70px', background:'var(--bg)', border:`1px solid ${f.cor}`, borderRadius:'10px', padding:'8px', color:f.cor, fontSize:'18px', fontWeight:700, outline:'none', textAlign:'center' }} />
                <span style={{ fontSize:'14px', color:f.cor, fontWeight:600 }}>%</span>
              </div>
            ))}
          </div>
          <button onClick={salvarConfig} disabled={salvando || totalDiv !== 100}
            style={{ width:'100%', padding:'14px', borderRadius:'var(--r)', background:totalDiv!==100?'var(--dim)':'var(--verde)', color:'#000', border:'none', fontSize:'14px', fontWeight:700, cursor:totalDiv!==100?'not-allowed':'pointer' }}>
            {salvando ? 'Salvando...' : '☁️ Salvar Fundos'}
          </button>
        </div>
      )}

      {/* Modal serviço custom */}
      {modalSvc && (
        <div style={{ position:'fixed', inset:0, zIndex:10001, background:'var(--bg)', overflowY:'auto' }}>
          <div style={{ maxWidth:'500px', margin:'0 auto', padding:'20px 16px 40px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:700 }}>{editId ? 'Editar Serviço' : 'Novo Serviço'}</div>
              <button onClick={() => setModalSvc(false)} style={{ background:'var(--s1)', border:'1px solid var(--borda)', color:'var(--txt)', padding:'7px 13px', borderRadius:10, cursor:'pointer', fontSize:13 }}>✕</button>
            </div>

            <label style={lbl}>Nome *</label>
            <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Cristalização" style={inp} />

            <label style={lbl}>Tempo estimado</label>
            <input value={form.tempo} onChange={e => setForm(p => ({ ...p, tempo: e.target.value }))} placeholder="Ex: 2h – 3h" style={inp} />

            <label style={lbl}>Descrição (aparece no PDF)</label>
            <input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="Descreva o que inclui..." style={inp} />

            <label style={lbl}>Categoria</label>
            <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} style={{ ...inp, appearance:'auto' } as any}>
              {CATS_CUSTOM.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={lbl}>Preços por veículo (R$)</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
              {([['hatch','🚗 Hatch'],['sedan','🚙 Sedan'],['suv','🛻 SUV']] as [keyof ServicoCustom, string][]).map(([k,l]) => (
                <div key={String(k)}>
                  <div style={{ fontSize:'10px', color:'var(--dim)', fontWeight:600, textAlign:'center', marginBottom:'4px' }}>{l}</div>
                  <input type="number" value={(form as any)[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: Number(e.target.value) }))} placeholder="0"
                    style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--verde)', borderRadius:'10px', padding:'10px 8px', color:'var(--verde)', fontSize:'18px', fontWeight:700, outline:'none', textAlign:'center' }} />
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'8px', marginTop:'24px' }}>
              {editId && (
                <button onClick={() => excluirSvc(editId)}
                  style={{ flex:1, padding:'13px', borderRadius:'var(--r)', border:'1px solid var(--erro)', background:'transparent', color:'var(--erro)', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                  🗑 Excluir
                </button>
              )}
              <button onClick={salvarSvc}
                style={{ flex:2, padding:'13px', borderRadius:'var(--r)', background:'var(--verde)', color:'#000', border:'none', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                SALVAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
