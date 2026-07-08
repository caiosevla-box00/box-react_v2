import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc, updateDoc, serverTimestamp } from '@/lib/firebase'
import { hoje, formatarDataBR, nomeDiaSemana, gerarId } from '@/lib/utils'
import { TEMPO_SERVICO } from '@/lib/servicos'
import type { Agendamento, Atendimento } from '@/types'

const TAXAS = [0,3.49,4.49,5.49,5.99,6.49,6.99,7.49,7.99,8.49,8.99,9.49,9.99]
const DIAS_SEMANA = ['D','S','T','Q','Q','S','S']

function buildDias(): string[] {
  const dias: string[] = []
  const base = new Date()
  base.setDate(base.getDate() - 30)
  for (let i = 0; i < 60; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dias.push(d.toISOString().slice(0, 10))
  }
  return dias
}

export function Agenda() {
  const { agendamentos, setAgendamentos, atendimentos, setAtendimentos, clientes, divisao, taxaDebito, toast_show, agendaDay, setAgendaDay } = useStore()
  const [selDay, setSelDay] = useState(agendaDay || hoje())
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [verTodos, setVerTodos] = useState(false)
  const [dataPicker, setDataPicker] = useState(false)
  const dias = useMemo(buildDias, [])
  const stripRef = React.useRef<HTMLDivElement>(null)
  const hojeRef = React.useRef<HTMLButtonElement>(null)

  // Quando a busca navega para um agendamento, usa a data passada pelo store
  useEffect(() => {
    if (agendaDay) {
      setSelDay(agendaDay)
      setVerTodos(false)
      setAgendaDay(null)
    }
  }, [agendaDay])

  // Auto scroll para hoje no strip
  useEffect(() => {
    if (hojeRef.current && stripRef.current) {
      const c = stripRef.current
      const el = hojeRef.current
      c.scrollLeft = el.offsetLeft - c.offsetWidth / 2 + el.offsetWidth / 2
    }
  }, [])

  function selecionarDia(iso: string) {
    setSelDay(iso)
    setVerTodos(false)
  }

  const dayAgs = useMemo(() =>
    agendamentos
      .filter(a => verTodos ? a.status !== 'cancelado' : (a.data === selDay && a.status !== 'cancelado'))
      .sort((a,b) => {
        if (verTodos) return b.data.localeCompare(a.data) || a.hora.localeCompare(b.hora)
        return a.hora.localeCompare(b.hora)
      }),
    [agendamentos, selDay, verTodos]
  )

  async function encerrar(ag: Agendamento) {
    const upd = { ...ag, status: 'concluido' as const }
    setAgendamentos(agendamentos.map(a => a.id === ag.id ? upd : a))
    await updateDoc(doc(db, COLS.agendamentos, ag.id), { status: 'concluido' })
    toast_show('✅ Serviço encerrado')
    const c = clientes.find(x => x.id === ag.clienteId)
    if (c?.tel) {
      const msg = `Olá ${c.nome?.split(' ')[0]}! Seu serviço foi concluído.\n🚗 Pode vir buscar seu carro!\n📍 BOX 0.0 — Estética Automotiva`
      const tel = (c.tel).replace(/\D/g, '')
      setTimeout(() => {
        if (confirm(`Enviar WhatsApp para ${c.nome}?`)) window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
      }, 200)
    }
  }

  async function cobrar(ag: Agendamento, forma: string, parcelas: number, taxa: number, valorCobrado: number) {
    const valor = ag.valorAcordado || 0
    const at: Atendimento = {
      id: gerarId(), clienteId: ag.clienteId,
      nomeCliente: clientes.find(x => x.id === ag.clienteId)?.nome || '',
      data: ag.data, servicos: ag.servico, valor,
      formaPagamento: forma, parcelas, taxaPct: taxa,
      valorCobrado, custoTaxa: valorCobrado - valor, valorLiquido: valor,
      divContas:   +(valor * divisao.contas   / 100).toFixed(2),
      divMaquinas: +(valor * divisao.maquinas / 100).toFixed(2),
      divEstoque:  +(valor * divisao.estoque  / 100).toFixed(2),
      divLucro:    +(valor * divisao.lucro    / 100).toFixed(2),
      criadoEm: hoje(),
    }
    setAtendimentos([at, ...atendimentos])
    setAgendamentos(agendamentos.map(a => a.id === ag.id ? { ...a, status: 'pago' as const } : a))
    await setDoc(doc(db, COLS.atendimentos, at.id), { ...at, criadoEm: serverTimestamp() })
    await updateDoc(doc(db, COLS.agendamentos, ag.id), { status: 'pago' })
    setCheckoutId(null)
    toast_show('💰 Pagamento registrado!')
  }

  return (
    <div>
      {/* Strip de dias */}
      <div ref={stripRef} style={{ display:'flex', gap:'4px', overflowX:'auto', marginBottom:'10px', paddingBottom:'4px' }}>
        {dias.map(iso => {
          const dt = new Date(iso + 'T12:00:00')
          const temAg = agendamentos.some(a => a.data === iso && a.status !== 'cancelado')
          const ativo = !verTodos && iso === selDay
          const isHoje = iso === hoje()
          return (
            <button key={iso} ref={isHoje ? hojeRef : null} onClick={() => selecionarDia(iso)} style={{
              minWidth:'46px', padding:'8px 4px', borderRadius:'var(--r)', flexShrink:0,
              background: ativo ? 'var(--verde)' : 'var(--s1)',
              border: `1px solid ${ativo ? 'var(--verde)' : isHoje ? 'rgba(170,255,0,.4)' : 'var(--borda)'}`,
              cursor:'pointer',
            }}>
              <div style={{ fontSize:'10px', fontWeight:600, color:ativo?'#000':isHoje?'var(--verde)':'var(--dim)' }}>{DIAS_SEMANA[dt.getDay()]}</div>
              <div style={{ fontSize:'16px', fontWeight:700, color:ativo?'#000':isHoje?'var(--verde)':'var(--txt)', lineHeight:1.2 }}>{dt.getDate()}</div>
              <div style={{ width:5, height:5, borderRadius:'50%', margin:'2px auto 0', background: ativo?'#000':temAg?'var(--verde)':'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* Controles */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', alignItems:'center' }}>
        {/* Seletor de data manual */}
        <div style={{ position:'relative', flex:1 }}>
          <button onClick={() => setDataPicker(!dataPicker)} style={{
            width:'100%', padding:'8px 12px', borderRadius:'var(--r)', background:'var(--s1)',
            border:'1px solid var(--borda)', color:'var(--txt)', fontSize:'12px', fontWeight:600,
            cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <span>{verTodos ? 'Todos os agendamentos' : `${nomeDiaSemana(selDay)}, ${formatarDataBR(selDay)}`}</span>
            <span style={{ color:'var(--dim)' }}>📅</span>
          </button>
          {dataPicker && (
            <input type="date" value={selDay} autoFocus
              onChange={e => { selecionarDia(e.target.value); setDataPicker(false) }}
              onBlur={() => setDataPicker(false)}
              style={{ position:'absolute', top:'100%', left:0, zIndex:100, width:'100%', padding:'10px', background:'var(--s2)', border:'1px solid var(--verde)', borderRadius:'var(--r)', color:'var(--txt)', fontSize:'15px', outline:'none', marginTop:'4px' }}
            />
          )}
        </div>

        {/* Botão Todos */}
        <button onClick={() => setVerTodos(!verTodos)} style={{
          padding:'8px 12px', borderRadius:'var(--r)', flexShrink:0,
          background: verTodos ? 'var(--verde)' : 'var(--s1)',
          border: `1px solid ${verTodos ? 'var(--verde)' : 'var(--borda)'}`,
          color: verTodos ? '#000' : 'var(--dim)',
          fontSize:'12px', fontWeight:600, cursor:'pointer',
        }}>
          Todos ({agendamentos.filter(a => a.status !== 'cancelado').length})
        </button>
      </div>

      {/* Lista */}
      {dayAgs.length === 0 ? (
        <div style={{ background:'var(--s1)', border:'1px dashed var(--borda)', borderRadius:'var(--r)', padding:'32px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'10px' }}>📅</div>
          <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'4px' }}>Nenhum agendamento</div>
          <div style={{ fontSize:'12px', color:'var(--dim)' }}>Faça um orçamento e agende pelo botão 🧾</div>
        </div>
      ) : dayAgs.map(ag => {
        const c = clientes.find(x => x.id === ag.clienteId)
        const COR: Record<string,string> = { agendado:'var(--verde)', concluido:'var(--alerta)', pago:'var(--azul)' }
        const cor = COR[ag.status] || 'var(--verde)'
        return (
          <div key={ag.id} style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'14px', marginBottom:'10px', borderLeft:`3px solid ${cor}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'16px', fontWeight:700 }}>{c?.nome || 'Cliente'}</div>
                <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'2px' }}>
                  {verTodos && <span style={{ color:'var(--verde)', marginRight:'6px' }}>{formatarDataBR(ag.data)}</span>}
                  {ag.hora} · {ag.servico}
                </div>
                {ag.obs && <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'4px', fontStyle:'italic' }}>{ag.obs}</div>}
              </div>
              <div style={{ textAlign:'right' }}>
                {(ag.valorAcordado||0) > 0 && <div style={{ fontSize:'18px', fontWeight:700, color:cor }}>R${ag.valorAcordado}</div>}
                <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px', background:`${cor}18`, color:cor, border:`1px solid ${cor}44` }}>
                  {ag.status === 'agendado' ? 'Agendado' : ag.status === 'concluido' ? 'Aguardando cobrança' : 'Pago'}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              {ag.status === 'agendado' && (
                <button onClick={() => encerrar(ag)} style={{ flex:1, padding:'10px', borderRadius:'10px', background:'var(--vbg)', border:'1px solid var(--verde)', color:'var(--verde)', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                  ✅ Encerrar
                </button>
              )}
              {ag.status === 'concluido' && (
                <button onClick={() => setCheckoutId(ag.id)} style={{ flex:1, padding:'10px', borderRadius:'10px', background:'var(--alerta)', border:'none', color:'#000', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                  💰 COBRAR
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Modal cobrança */}
      {checkoutId && (() => {
        const ag = agendamentos.find(a => a.id === checkoutId)
        if (!ag) return null
        return <CobrancaModal ag={ag} onConfirmar={(f,p,t,vc) => cobrar(ag,f,p,t,vc)} onCancelar={() => setCheckoutId(null)} taxaDebito={taxaDebito} divisao={divisao} />
      })()}
    </div>
  )
}

function CobrancaModal({ ag, onConfirmar, onCancelar, taxaDebito, divisao }: {
  ag: Agendamento
  onConfirmar: (forma: string, parcelas: number, taxa: number, valorCobrado: number) => void
  onCancelar: () => void
  taxaDebito: number
  divisao: { contas:number; maquinas:number; estoque:number; lucro:number }
}) {
  const [forma, setForma] = useState<'pix'|'debito'|'credito'>('pix')
  const [parcelas, setParcelas] = useState(1)
  const valor = ag.valorAcordado || 0
  const taxa = forma==='pix' ? 0 : forma==='debito' ? taxaDebito : (TAXAS[parcelas]||0)
  const valorCobrado = taxa > 0 ? Math.ceil(valor / (1 - taxa/100)) : valor

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onCancelar()}>
      <div className="slide-up" style={{ width:'100%', maxWidth:'500px', background:'var(--s2)', borderRadius:'20px 20px 0 0', padding:'20px 18px 40px' }}>
        <div style={{ width:36, height:4, background:'var(--borda)', borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'4px' }}>Registrar Pagamento</div>
        <div style={{ fontSize:'13px', color:'var(--dim)', marginBottom:'16px' }}>{ag.servico} · {formatarDataBR(ag.data)}</div>

        <div style={{ background:'var(--vbg)', border:'1px solid var(--verde)', borderRadius:12, padding:12, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'13px', color:'var(--dim)' }}>Valor acordado</span>
          <span style={{ fontSize:'26px', fontWeight:800, color:'var(--verde)' }}>R${valor}</span>
        </div>

        <div style={{ fontSize:'11px', color:'var(--dim)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Forma de pagamento</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:14 }}>
          {(['pix','debito','credito'] as const).map(f => (
            <button key={f} onClick={() => { setForma(f); setParcelas(1) }} style={{
              padding:'10px 4px', borderRadius:10, fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
              background: forma===f ? 'var(--verde)' : 'var(--s1)',
              color: forma===f ? '#000' : 'var(--dim)',
              outline: forma===f ? 'none' : '1px solid var(--borda)',
            }}>
              {f==='pix'?'⚡ PIX':f==='debito'?'💳 Débito':'💳 Crédito'}
              <div style={{ fontSize:9, marginTop:2, opacity:.8 }}>{f==='pix'?'sem taxa':f==='debito'?`${taxaDebito}%`:`${TAXAS[1]}%+`}</div>
            </button>
          ))}
        </div>

        {forma==='credito' && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:'11px', color:'var(--dim)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Parcelas</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4 }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                <button key={p} onClick={() => setParcelas(p)} style={{ padding:'6px 2px', borderRadius:8, fontSize:11, fontWeight:600, border:'none', cursor:'pointer', background:parcelas===p?'var(--verde)':'var(--s1)', color:parcelas===p?'#000':'var(--dim)', outline:parcelas===p?'none':'1px solid var(--borda)' }}>
                  {p}x
                </button>
              ))}
            </div>
          </div>
        )}

        {taxa > 0 && (
          <div style={{ background:'var(--bg)', borderRadius:10, padding:10, marginBottom:14, fontSize:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:'var(--dim)' }}>Taxa ({taxa}%)</span>
              <span style={{ color:'var(--erro)' }}>+R${(valorCobrado-valor).toFixed(2)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--dim)', fontWeight:600 }}>Cobrar do cliente</span>
              <span style={{ color:'var(--alerta)', fontWeight:700, fontSize:15 }}>R${valorCobrado.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancelar} style={{ flex:1, padding:13, borderRadius:12, border:'1px solid var(--borda)', background:'transparent', color:'var(--dim)', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
          <button onClick={() => onConfirmar(forma, parcelas, taxa, valorCobrado)} style={{ flex:2, padding:13, borderRadius:12, background:'var(--verde)', color:'#000', border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>
            ✅ CONFIRMAR PAGAMENTO
          </button>
        </div>
      </div>
    </div>
  )
}
