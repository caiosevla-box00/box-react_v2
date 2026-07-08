import React, { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc, deleteDoc } from '@/lib/firebase'
import { serverTimestamp } from 'firebase/firestore'
import { gerarId, hoje, formatarDataBR, getMesAtual } from '@/lib/utils'
import type { Saida } from '@/types'

type AbaFin = 'resumo' | 'saidas' | 'historico'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getMeses(): string[] {
  const meses: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }
  return meses
}

export function Financeiro() {
  const { atendimentos, saidas, setSaidas, divisao, meta, toast_show } = useStore()
  const [aba, setAba] = useState<AbaFin>('resumo')
  const [mesSel, setMesSel] = useState(getMesAtual())
  const [modalSaida, setModalSaida] = useState(false)
  const [formSaida, setFormSaida] = useState({ desc:'', valor:'', data:hoje() })
  const [salvando, setSalvando] = useState(false)

  const meses = useMemo(getMeses, [])

  // Atendimentos do mês
  const atsMes = useMemo(() =>
    atendimentos.filter(a => (a.data||'').startsWith(mesSel)),
    [atendimentos, mesSel]
  )

  const receitaBruta   = useMemo(() => atsMes.reduce((s,a) => s + (a.valorCobrado || a.valor || 0), 0), [atsMes])
  const taxas          = useMemo(() => atsMes.reduce((s,a) => s + (a.custoTaxa || 0), 0), [atsMes])
  const receitaLiquida = useMemo(() => atsMes.reduce((s,a) => s + (a.valorLiquido || a.valor || 0), 0), [atsMes])
  const saidasMes      = useMemo(() => saidas.filter(s => (s.data||'').startsWith(mesSel)), [saidas, mesSel])
  const totalSaidas    = useMemo(() => saidasMes.reduce((s,x) => s + (x.valor||0), 0), [saidasMes])
  const lucroReal      = receitaLiquida - totalSaidas
  const metaPct        = meta > 0 ? Math.min(100, Math.round(receitaLiquida / meta * 100)) : 0

  // Divisão de fundos
  const fundos = {
    contas:   +(receitaLiquida * divisao.contas   / 100).toFixed(2),
    maquinas: +(receitaLiquida * divisao.maquinas / 100).toFixed(2),
    estoque:  +(receitaLiquida * divisao.estoque  / 100).toFixed(2),
    lucro:    +(receitaLiquida * divisao.lucro    / 100).toFixed(2),
  }

  // Dados do gráfico — últimos 6 meses
  const dadosGrafico = useMemo(() =>
    meses.map(m => ({
      mes: MESES[parseInt(m.split('-')[1]) - 1],
      valor: atendimentos.filter(a => (a.data||'').startsWith(m)).reduce((s,a) => s + (a.valorLiquido||a.valor||0), 0)
    })),
    [atendimentos, meses]
  )
  const maxGrafico = Math.max(...dadosGrafico.map(d => d.valor), 1)

  async function salvarSaida() {
    if (!formSaida.desc.trim() || !formSaida.valor) { toast_show('⚠️ Preencha todos os campos'); return }
    setSalvando(true)
    const s: Saida = { id: gerarId(), desc: formSaida.desc.trim(), valor: Number(formSaida.valor), data: formSaida.data, criadoEm: hoje() }
    setSaidas([s, ...saidas])
    setModalSaida(false)
    setFormSaida({ desc:'', valor:'', data:hoje() })
    try {
      await setDoc(doc(db, COLS.saidas, s.id), { ...s, criadoEm: serverTimestamp() })
      toast_show('✅ Saída registrada!')
    } catch { toast_show('💾 Salvo localmente') }
    setSalvando(false)
  }

  async function excluirSaida(id: string) {
    if (!confirm('Excluir esta saída?')) return
    setSaidas(saidas.filter(s => s.id !== id))
    try { await deleteDoc(doc(db, COLS.saidas, id)) } catch {}
    toast_show('🗑 Saída removida')
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg)', border:'1px solid var(--borda)', borderRadius:'var(--r)', padding:'11px 14px', color:'var(--txt)', outline:'none', fontSize:'15px' }
  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:'6px', marginTop:'12px' }

  return (
    <div>
      <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'16px' }}>Financeiro</div>

      {/* Seletor de mês */}
      <div style={{ display:'flex', gap:'4px', overflowX:'auto', marginBottom:'16px', paddingBottom:'4px' }}>
        {meses.map(m => {
          const [ano, mes] = m.split('-')
          const label = `${MESES[parseInt(mes)-1]} ${ano.slice(2)}`
          const ativo = m === mesSel
          return (
            <button key={m} onClick={() => setMesSel(m)} style={{ minWidth:'56px', padding:'8px 6px', borderRadius:'var(--r)', flexShrink:0, background:ativo?'var(--verde)':'var(--s1)', border:`1px solid ${ativo?'var(--verde)':'var(--borda)'}`, color:ativo?'#000':'var(--dim)', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Sub abas */}
      <div style={{ display:'flex', gap:'4px', background:'var(--s1)', padding:'4px', borderRadius:'var(--r)', marginBottom:'16px' }}>
        {([['resumo','📊 Resumo'],['saidas','💸 Saídas'],['historico','📋 Histórico']] as [AbaFin,string][]).map(([a,l]) => (
          <button key={a} onClick={() => setAba(a)} style={{ flex:1, padding:'9px 4px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, background:aba===a?'var(--verde)':'transparent', color:aba===a?'#000':'var(--dim)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── RESUMO ── */}
      {aba === 'resumo' && (
        <div>
          {/* Cards principais */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
            {[
              { icon:'💰', val:`R$${receitaLiquida.toFixed(0)}`, label:'Receita líquida', cor:'var(--verde)' },
              { icon:'💳', val:`R$${receitaBruta.toFixed(0)}`,   label:'Receita bruta',   cor:'var(--txt)'  },
              { icon:'💸', val:`R$${totalSaidas.toFixed(0)}`,    label:'Saídas',           cor:'var(--erro)' },
              { icon:'🏆', val:`R$${lucroReal.toFixed(0)}`,      label:'Lucro real',       cor: lucroReal >= 0 ? 'var(--verde)' : 'var(--erro)' },
            ].map((c,i) => (
              <div key={i} style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'13px 12px' }}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{c.icon}</div>
                <div style={{ fontSize:'20px', fontWeight:700, color:c.cor, lineHeight:1 }}>{c.val}</div>
                <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'4px' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Meta */}
          {meta > 0 && (
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'13px', marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <div style={{ fontSize:'13px', fontWeight:600 }}>Meta R${meta.toFixed(0)}</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:metaPct>=100?'var(--verde)':metaPct>=60?'var(--alerta)':'var(--erro)' }}>{metaPct}%</div>
              </div>
              <div style={{ height:'6px', background:'var(--borda)', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${metaPct}%`, borderRadius:'4px', background:metaPct>=100?'var(--verde)':metaPct>=60?'var(--alerta)':'var(--erro)', transition:'width .5s' }} />
              </div>
              <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'5px' }}>
                {metaPct < 100 ? `Faltam R${(meta-receitaLiquida).toFixed(0)}` : '🎉 Meta atingida!'}
              </div>
            </div>
          )}

          {/* Gráfico barras */}
          <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'12px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px' }}>Últimos 6 meses</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'80px' }}>
              {dadosGrafico.map((d, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', height:`${Math.round((d.valor/maxGrafico)*72)+4}px`, background: meses[i]===mesSel ? 'var(--verde)' : 'var(--borda)', borderRadius:'4px 4px 0 0', minHeight:'4px', transition:'height .4s ease' }} />
                  <div style={{ fontSize:'9px', color: meses[i]===mesSel ? 'var(--verde)' : 'var(--dim)', fontWeight:meses[i]===mesSel?700:400 }}>{d.mes}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divisão de fundos */}
          {receitaLiquida > 0 && (
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px', marginBottom:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>Divisão de Fundos</div>
              {[
                { label:'🏠 Contas Fixas', val:fundos.contas,   pct:divisao.contas,   cor:'var(--azul)'  },
                { label:'🔧 Máquinas',     val:fundos.maquinas, pct:divisao.maquinas, cor:'#a29bfe'      },
                { label:'🧴 Estoque',      val:fundos.estoque,  pct:divisao.estoque,  cor:'#fd79a8'      },
                { label:'💰 Lucro Real',   val:fundos.lucro,    pct:divisao.lucro,    cor:'var(--verde)' },
              ].map((f,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
                    <div style={{ fontSize:'13px' }}>{f.label}</div>
                    <div style={{ flex:1, height:'4px', background:'var(--borda)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${f.pct}%`, background:f.cor, borderRadius:'2px' }} />
                    </div>
                    <span style={{ fontSize:'11px', color:'var(--dim)' }}>{f.pct}%</span>
                  </div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:f.cor, marginLeft:'12px', minWidth:'70px', textAlign:'right' }}>R${f.val.toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Taxas */}
          {taxas > 0 && (
            <div style={{ background:'rgba(255,107,107,.06)', border:'1px solid rgba(255,107,107,.2)', borderRadius:'var(--r)', padding:'12px', marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'13px', color:'var(--dim)' }}>💳 Taxas de cartão pagas</span>
                <span style={{ fontSize:'14px', fontWeight:700, color:'var(--erro)' }}>-R${taxas.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Qtd atendimentos */}
          <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'13px', color:'var(--dim)' }}>Atendimentos no mês</span>
            <span style={{ fontSize:'18px', fontWeight:700, color:'var(--verde)' }}>{atsMes.length}</span>
          </div>
        </div>
      )}

      {/* ── SAÍDAS ── */}
      {aba === 'saidas' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'15px', fontWeight:600 }}>Saídas — {MESES[parseInt(mesSel.split('-')[1])-1]}</div>
              <div style={{ fontSize:'13px', color:'var(--erro)', marginTop:'2px' }}>Total: R${totalSaidas.toFixed(2)}</div>
            </div>
            <button onClick={() => setModalSaida(true)}
              style={{ background:'var(--verde)', color:'#000', fontSize:'13px', fontWeight:700, padding:'9px 16px', borderRadius:'20px', border:'none', cursor:'pointer' }}>
              + Nova
            </button>
          </div>

          {saidasMes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', background:'var(--s1)', borderRadius:'var(--r)', border:'1px dashed var(--borda)' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>💸</div>
              <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'6px' }}>Nenhuma saída registrada</div>
              <div style={{ fontSize:'13px', color:'var(--dim)' }}>Registre seus gastos operacionais</div>
            </div>
          ) : saidasMes.map(s => (
            <div key={s.id} style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'13px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:600 }}>{s.desc}</div>
                <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'3px' }}>{formatarDataBR(s.data)}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ fontSize:'16px', fontWeight:700, color:'var(--erro)' }}>-R${s.valor.toFixed(2)}</div>
                <button onClick={() => excluirSaida(s.id)} style={{ background:'transparent', border:'none', color:'var(--dim)', cursor:'pointer', fontSize:'16px', padding:'4px' }}>🗑</button>
              </div>
            </div>
          ))}

          {/* Modal nova saída */}
          {modalSaida && (
            <div style={{ position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
              onClick={e => e.target===e.currentTarget && setModalSaida(false)}>
              <div className="slide-up" style={{ width:'100%', maxWidth:'500px', background:'var(--s2)', borderRadius:'20px 20px 0 0', padding:'20px 18px 40px' }}>
                <div style={{ width:36, height:4, background:'var(--borda)', borderRadius:2, margin:'0 auto 16px' }} />
                <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'16px' }}>Nova Saída</div>
                <label style={lbl}>Descrição *</label>
                <input value={formSaida.desc} onChange={e => setFormSaida(p => ({ ...p, desc:e.target.value }))} placeholder="Ex: Shampoo, produto X..." style={inp} />
                <label style={lbl}>Valor (R$) *</label>
                <input type="number" value={formSaida.valor} onChange={e => setFormSaida(p => ({ ...p, valor:e.target.value }))} placeholder="0.00" style={{ ...inp, fontSize:'22px', fontWeight:700, color:'var(--erro)', textAlign:'center' }} />
                <label style={lbl}>Data</label>
                <input type="date" value={formSaida.data} onChange={e => setFormSaida(p => ({ ...p, data:e.target.value }))} style={inp} />
                <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
                  <button onClick={() => setModalSaida(false)} style={{ flex:1, padding:13, borderRadius:'var(--r)', border:'1px solid var(--borda)', background:'transparent', color:'var(--dim)', cursor:'pointer', fontWeight:600 }}>Cancelar</button>
                  <button onClick={salvarSaida} disabled={salvando} style={{ flex:2, padding:13, borderRadius:'var(--r)', background:'var(--verde)', color:'#000', border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                    {salvando ? 'Salvando...' : 'REGISTRAR'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {aba === 'historico' && (
        <div>
          <div style={{ fontSize:'13px', color:'var(--dim)', marginBottom:'14px' }}>
            {atsMes.length} atendimento{atsMes.length!==1?'s':''} em {MESES[parseInt(mesSel.split('-')[1])-1]}
          </div>
          {atsMes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', background:'var(--s1)', borderRadius:'var(--r)', border:'1px dashed var(--borda)' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>📋</div>
              <div style={{ fontSize:'14px', fontWeight:600 }}>Nenhum atendimento neste mês</div>
            </div>
          ) : atsMes.map(at => {
            const FPAG: Record<string,string> = { pix:'⚡ PIX', debito:'💳 Débito', credito:'💳 Crédito' }
            return (
              <div key={at.id} style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'13px', marginBottom:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'14px', fontWeight:600 }}>{at.nomeCliente || 'Cliente'}</div>
                    <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'2px' }}>{at.servicos}</div>
                    <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'2px' }}>
                      {formatarDataBR(at.data)} · {FPAG[at.formaPagamento||'']||at.formaPagamento}
                      {at.parcelas && at.parcelas > 1 ? ` ${at.parcelas}x` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:'12px' }}>
                    <div style={{ fontSize:'16px', fontWeight:700, color:'var(--verde)' }}>R${(at.valorLiquido||at.valor||0).toFixed(2)}</div>
                    {(at.custoTaxa||0) > 0 && <div style={{ fontSize:'10px', color:'var(--erro)', marginTop:'2px' }}>taxa -R${(at.custoTaxa||0).toFixed(2)}</div>}
                  </div>
                </div>
                {/* Fundos inline */}
                {(at.divLucro||0) > 0 && (
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    {[
                      { l:'Contas', v:at.divContas, c:'var(--azul)' },
                      { l:'Máq.',   v:at.divMaquinas, c:'#a29bfe'  },
                      { l:'Est.',   v:at.divEstoque, c:'#fd79a8'   },
                      { l:'Lucro',  v:at.divLucro, c:'var(--verde)'},
                    ].map((f,i) => (
                      <div key={i} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'20px', background:`${f.c}18`, color:f.c, fontWeight:600 }}>
                        {f.l} R${(f.v||0).toFixed(0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
