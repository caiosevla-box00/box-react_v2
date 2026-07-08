import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { formatarDataBR } from '@/lib/utils'
import type { TabId } from '@/types'

export function BuscaGlobal() {
  const { clientes, agendamentos, atendimentos, setTab, setAgendaDay } = useStore()
  const [aberta, setAberta] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (aberta) setTimeout(() => inputRef.current?.focus(), 80)
  }, [aberta])

  function fechar() {
    setAberta(false)
    setQ('')
  }

  const resultados = useMemo(() => {
    if (q.trim().length < 2) return []
    const s = q.toLowerCase()
    type Res = { tipo: string; titulo: string; sub: string; meta?: string; cor: string; tab: TabId; agData?: string }
    const res: Res[] = []

    clientes.forEach(c => {
      if (c.nome?.toLowerCase().includes(s) || (c.tel || '').includes(s) || (c.marca || '').toLowerCase().includes(s)) {
        res.push({
          tipo: 'Cliente', titulo: c.nome,
          sub: [c.tel, c.marca, c.modelo].filter(Boolean).join(' · '),
          cor: 'var(--verde)', tab: 'clientes'
        })
      }
    })

    agendamentos.filter(a => a.status !== 'cancelado').forEach(ag => {
      const c = clientes.find(x => x.id === ag.clienteId)
      if ((c?.nome || '').toLowerCase().includes(s) || (ag.servico || '').toLowerCase().includes(s)) {
        const COR: Record<string, string> = { agendado: 'var(--verde)', concluido: 'var(--alerta)', pago: 'var(--azul)' }
        res.push({
          tipo: 'Agendamento', titulo: c?.nome || 'Cliente',
          sub: `${formatarDataBR(ag.data)} ${ag.hora} · ${ag.servico}`,
          meta: ag.status, cor: COR[ag.status] || 'var(--verde)',
          tab: 'agenda', agData: ag.data
        })
      }
    })

    atendimentos.forEach(at => {
      if ((at.nomeCliente || '').toLowerCase().includes(s) || (at.servicos || '').toLowerCase().includes(s)) {
        res.push({
          tipo: 'Atendimento', titulo: at.nomeCliente || 'Cliente',
          sub: `${formatarDataBR(at.data)} · ${at.servicos}`,
          meta: `R$${at.valor}`, cor: 'var(--azul)', tab: 'financeiro'
        })
      }
    })

    return res.slice(0, 10)
  }, [q, clientes, agendamentos, atendimentos])

  return (
    <>
      <button
        onClick={() => setAberta(true)}
        style={{ background: 'var(--s1)', border: '0.5px solid var(--borda)', borderRadius: '20px', padding: '6px 10px', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
      >
        🔍
      </button>

      {aberta && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '52px' }}
          onClick={e => e.target === e.currentTarget && fechar()}
        >
          <div style={{ width: 'calc(100% - 32px)', maxWidth: '468px', background: 'var(--s2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', borderBottom: '1px solid var(--borda)' }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Clientes, agendamentos, servicos..."
                style={{ flex: 1, background: 'none', border: 'none', color: 'var(--txt)', fontSize: '16px', outline: 'none' }}
              />
              {q && (
                <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>
                  X
                </button>
              )}
              <button onClick={fechar} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                Fechar
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {q.length < 2 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--dim)', fontSize: '13px' }}>
                  Digite 2+ caracteres
                </div>
              ) : resultados.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--dim)', fontSize: '13px' }}>
                  Nenhum resultado
                </div>
              ) : resultados.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (r.agData) setAgendaDay(r.agData)
                    setTab(r.tab)
                    fechar()
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '0.5px solid var(--borda)', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${r.cor}18`, border: `1px solid ${r.cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {r.tipo === 'Cliente' ? '👤' : r.tipo === 'Agendamento' ? '📅' : '💰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.titulo}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.sub}
                    </div>
                  </div>
                  {r.meta && (
                    <div style={{ fontSize: '11px', fontWeight: 600, color: r.cor, flexShrink: 0 }}>
                      {r.meta}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
