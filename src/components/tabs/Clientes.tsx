import React, { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc, deleteDoc } from '@/lib/firebase'
import { serverTimestamp } from 'firebase/firestore'
import { gerarId, hoje, diasDesde, formatarDataBR } from '@/lib/utils'
import type { Cliente } from '@/types'

const TIPOS_V_L: Record<string,string> = { hatch:'🚗 Hatch', sedan:'🚙 Sedan', suv:'🛻 SUV' }

export function Clientes() {
  const { clientes, setClientes, atendimentos, agendamentos, toast_show } = useStore()
  const [busca, setBusca] = useState('')
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [modalNovo, setModalNovo] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Partial<Cliente>>({})

  const clientesFil = useMemo(() => {
    const q = busca.toLowerCase()
    return clientes.filter(c =>
      !q || c.nome?.toLowerCase().includes(q) || (c.tel||'').includes(q) || (c.marca||'').toLowerCase().includes(q)
    )
  }, [clientes, busca])

  function ultimoAtend(id: string) {
    return atendimentos.filter(a => a.clienteId === id).sort((a,b) => b.data.localeCompare(a.data))[0]
  }
  function totalGasto(id: string) {
    return atendimentos.filter(a => a.clienteId === id).reduce((s,a) => s + (a.valorLiquido || a.valor || 0), 0)
  }

  function abrirNovo() {
    setForm({ tipoVeiculo:'hatch' })
    setEditId(null)
    setModalNovo(true)
  }
  function abrirEditar(c: Cliente) {
    setForm({ ...c })
    setEditId(c.id)
    setModalNovo(true)
  }

  async function salvar() {
    if (!form.nome?.trim()) { toast_show('⚠️ Nome obrigatório'); return }
    setSalvando(true)
    const c: Cliente = { id: editId || gerarId(), criadoEm: hoje(), ...form, nome: form.nome!.trim() }
    const lista = editId ? clientes.map(x => x.id === editId ? c : x) : [c, ...clientes]
    setClientes(lista)
    setModalNovo(false)
    try {
      await setDoc(doc(db, COLS.clientes, c.id), { ...c, updatedAt: serverTimestamp() }, { merge: true })
      toast_show(editId ? '✅ Cliente atualizado!' : '✅ Cliente salvo!')
    } catch { toast_show('💾 Salvo localmente') }
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este cliente?')) return
    setClientes(clientes.filter(c => c.id !== id))
    setPerfilId(null)
    try { await deleteDoc(doc(db, COLS.clientes, id)) } catch {}
    toast_show('🗑 Cliente removido')
  }

  function chamarDeVolta(c: Cliente) {
    const ult = ultimoAtend(c.id)
    const msg = `Olá ${c.nome?.split(' ')[0]}! 🚗✨\nFaz um tempo que não te vemos por aqui!\nQue tal agendar uma lavagem ou serviço para o seu carro?\nTemos horários disponíveis — é só me chamar! 😊\n📍 BOX 0.0 — Estética Automotiva`
    const tel = (c.tel||'').replace(/\D/g,'')
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg)', border:'1px solid var(--borda)', borderRadius:'var(--r)', padding:'11px 14px', color:'var(--txt)', outline:'none', fontSize:'15px' }
  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:'6px', marginTop:'12px' }

  // Perfil do cliente
  const perfilCliente = perfilId ? clientes.find(c => c.id === perfilId) : null
  if (perfilCliente) {
    const ult = ultimoAtend(perfilCliente.id)
    const total = totalGasto(perfilCliente.id)
    const ats = atendimentos.filter(a => a.clienteId === perfilCliente.id).sort((a,b) => b.data.localeCompare(a.data))
    const ags = agendamentos.filter(a => a.clienteId === perfilCliente.id && a.status !== 'cancelado').sort((a,b) => b.data.localeCompare(a.data)).slice(0,3)
    const dias = diasDesde(ult?.data || '')

    return (
      <div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'20px' }}>
          <button onClick={() => setPerfilId(null)} style={{ background:'var(--s1)', border:'1px solid var(--borda)', color:'var(--txt)', padding:'7px 13px', borderRadius:10, cursor:'pointer', fontSize:13 }}>‹ Voltar</button>
          <div style={{ fontSize:'17px', fontWeight:700, flex:1 }}>{perfilCliente.nome}</div>
          <button onClick={() => abrirEditar(perfilCliente)} style={{ background:'var(--s1)', border:'1px solid var(--borda)', color:'var(--txt)', padding:'7px 13px', borderRadius:10, cursor:'pointer', fontSize:13 }}>✏️</button>
        </div>

        {/* Avatar + info */}
        <div style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'16px', marginBottom:'12px', display:'flex', gap:'14px', alignItems:'center' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--vbg)', border:'2px solid var(--verde)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'var(--verde)', flexShrink:0 }}>
            {perfilCliente.nome[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:700 }}>{perfilCliente.nome}</div>
            {perfilCliente.tel && <div style={{ fontSize:'13px', color:'var(--dim)', marginTop:'2px' }}>📱 {perfilCliente.tel}</div>}
            {(perfilCliente.marca || perfilCliente.modelo) && <div style={{ fontSize:'13px', color:'var(--dim)', marginTop:'2px' }}>🚗 {[perfilCliente.marca, perfilCliente.modelo, perfilCliente.ano].filter(Boolean).join(' ')}</div>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'12px' }}>
          <div style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'18px', fontWeight:700, color:'var(--verde)' }}>R${total.toFixed(0)}</div>
            <div style={{ fontSize:'10px', color:'var(--dim)', marginTop:'3px' }}>Total gasto</div>
          </div>
          <div style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'18px', fontWeight:700, color:'var(--verde)' }}>{ats.length}</div>
            <div style={{ fontSize:'10px', color:'var(--dim)', marginTop:'3px' }}>Atendimentos</div>
          </div>
          <div style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'18px', fontWeight:700, color: dias !== null && dias >= 30 ? 'var(--alerta)' : 'var(--verde)' }}>
              {dias !== null ? `${dias}d` : '—'}
            </div>
            <div style={{ fontSize:'10px', color:'var(--dim)', marginTop:'3px' }}>Desde última visita</div>
          </div>
        </div>

        {/* Alerta retorno */}
        {dias !== null && dias >= 30 && perfilCliente.tel && (
          <button onClick={() => chamarDeVolta(perfilCliente)}
            style={{ width:'100%', padding:'12px', borderRadius:'var(--r)', background:'rgba(240,165,0,.1)', border:'1px solid rgba(240,165,0,.4)', color:'var(--alerta)', fontSize:'13px', fontWeight:600, cursor:'pointer', marginBottom:'12px', textAlign:'center' }}>
            🔔 {dias} dias sem visita — Chamar de volta via WhatsApp
          </button>
        )}

        {/* Últimos agendamentos */}
        {ags.length > 0 && (
          <div style={{ marginBottom:'12px' }}>
            <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>Agendamentos</div>
            {ags.map(ag => (
              <div key={ag.id} style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'11px', marginBottom:'6px', display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600 }}>{ag.servico}</div>
                  <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'2px' }}>{formatarDataBR(ag.data)} às {ag.hora}</div>
                </div>
                <span style={{ fontSize:'10px', fontWeight:600, padding:'3px 8px', borderRadius:'20px', height:'fit-content', background: ag.status==='pago'?'rgba(116,185,255,.2)':ag.status==='concluido'?'rgba(240,165,0,.2)':'rgba(170,255,0,.1)', color: ag.status==='pago'?'var(--azul)':ag.status==='concluido'?'var(--alerta)':'var(--verde)' }}>
                  {ag.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Histórico atendimentos */}
        {ats.length > 0 && (
          <div>
            <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>Histórico</div>
            {ats.slice(0,10).map(at => (
              <div key={at.id} style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'11px', marginBottom:'6px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600 }}>{at.servicos}</div>
                  <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'2px' }}>{formatarDataBR(at.data)} · {(at.formaPagamento||'').toUpperCase()}</div>
                </div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'var(--verde)' }}>R${(at.valorLiquido||at.valor||0).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => excluir(perfilCliente.id)} style={{ width:'100%', marginTop:'16px', padding:'12px', borderRadius:'var(--r)', border:'1px solid var(--erro)', background:'transparent', color:'var(--erro)', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
          🗑 Excluir cliente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <div style={{ fontSize:'20px', fontWeight:700 }}>Clientes <span style={{ fontSize:'14px', color:'var(--dim)', fontWeight:400 }}>({clientes.length})</span></div>
        <button onClick={abrirNovo} style={{ background:'var(--verde)', color:'#000', fontSize:'13px', fontWeight:700, padding:'9px 16px', borderRadius:'20px', border:'none', cursor:'pointer' }}>+ Novo</button>
      </div>

      {/* Busca */}
      <div style={{ background:'var(--s1)', border:'1px solid var(--borda)', borderRadius:'var(--r)', padding:'10px 14px', display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px' }}>
        <span>🔍</span>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou veículo..."
          style={{ background:'none', border:'none', color:'var(--txt)', fontSize:'15px', width:'100%', outline:'none' }} />
        {busca && <button onClick={() => setBusca('')} style={{ background:'none', border:'none', color:'var(--dim)', cursor:'pointer', fontSize:'16px' }}>✕</button>}
      </div>

      {/* Lista */}
      {clientesFil.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>👥</div>
          <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'6px' }}>{busca ? 'Nenhum resultado' : 'Nenhum cliente'}</div>
          {!busca && <div style={{ fontSize:'13px', color:'var(--dim)' }}>Adicione clientes ou faça um orçamento</div>}
        </div>
      ) : clientesFil.map(c => {
        const ult = ultimoAtend(c.id)
        const dias = diasDesde(ult?.data || c.criadoEm || '')
        const semRetorno = dias !== null && dias >= 30
        return (
          <button key={c.id} onClick={() => setPerfilId(c.id)}
            style={{ width:'100%', textAlign:'left', background:'var(--s1)', border:`1px solid ${semRetorno?'rgba(240,165,0,.4)':'var(--borda)'}`, borderRadius:'var(--r)', padding:'13px', marginBottom:'8px', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--vbg)', border:'1.5px solid var(--verde)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'var(--verde)', flexShrink:0 }}>
                {c.nome[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'15px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px' }}>
                  {c.nome}
                  {semRetorno && <span style={{ fontSize:'10px', background:'rgba(240,165,0,.2)', color:'var(--alerta)', padding:'2px 6px', borderRadius:'20px', fontWeight:600, flexShrink:0 }}>+{dias}d</span>}
                </div>
                <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {[c.tel, c.marca, c.modelo].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--verde)' }}>R${totalGasto(c.id).toFixed(0)}</div>
                <div style={{ fontSize:'10px', color:'var(--dim)', marginTop:'2px' }}>{atendimentos.filter(a => a.clienteId === c.id).length} atend.</div>
              </div>
            </div>
          </button>
        )
      })}

      {/* Modal novo/editar */}
      {modalNovo && (
        <div style={{ position:'fixed', inset:0, zIndex:10001, background:'var(--bg)', overflowY:'auto' }}>
          <div style={{ maxWidth:'500px', margin:'0 auto', padding:'20px 16px 40px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:700 }}>{editId ? 'Editar Cliente' : 'Novo Cliente'}</div>
              <button onClick={() => setModalNovo(false)} style={{ background:'var(--s1)', border:'1px solid var(--borda)', color:'var(--txt)', padding:'7px 13px', borderRadius:10, cursor:'pointer', fontSize:13 }}>✕</button>
            </div>
            <label style={lbl}>Nome *</label>
            <input value={form.nome||''} onChange={e => setForm(p => ({ ...p, nome:e.target.value }))} placeholder="Nome completo" style={inp} />
            <label style={lbl}>Telefone / WhatsApp</label>
            <input type="tel" value={form.tel||''} onChange={e => setForm(p => ({ ...p, tel:e.target.value }))} placeholder="(11) 99999-9999" style={inp} />
            <label style={lbl}>Marca do veículo</label>
            <input value={form.marca||''} onChange={e => setForm(p => ({ ...p, marca:e.target.value }))} placeholder="Ex: Hyundai" style={inp} />
            <label style={lbl}>Modelo</label>
            <input value={form.modelo||''} onChange={e => setForm(p => ({ ...p, modelo:e.target.value }))} placeholder="Ex: HB20" style={inp} />
            <label style={lbl}>Ano</label>
            <input value={form.ano||''} onChange={e => setForm(p => ({ ...p, ano:e.target.value }))} placeholder="Ex: 2021" style={inp} />
            <label style={lbl}>Cor</label>
            <input value={form.cor||''} onChange={e => setForm(p => ({ ...p, cor:e.target.value }))} placeholder="Ex: Prata" style={inp} />
            <label style={lbl}>Tipo de veículo</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
              {(['hatch','sedan','suv'] as const).map(v => (
                <button key={v} onClick={() => setForm(p => ({ ...p, tipoVeiculo:v }))}
                  style={{ padding:'10px 4px', borderRadius:10, fontSize:12, fontWeight:600, border:`1px solid ${form.tipoVeiculo===v?'var(--verde)':'var(--borda)'}`, background:form.tipoVeiculo===v?'var(--vbg)':'var(--s1)', color:form.tipoVeiculo===v?'var(--verde)':'var(--dim)', cursor:'pointer' }}>
                  {TIPOS_V_L[v]}
                </button>
              ))}
            </div>
            <button onClick={salvar} disabled={salvando}
              style={{ width:'100%', marginTop:'24px', padding:15, borderRadius:'var(--r)', background:salvando?'var(--dim)':'var(--verde)', color:'#000', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              {salvando ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
