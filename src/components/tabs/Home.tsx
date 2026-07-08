import { useMemo } from 'react'
import { useStore } from '@/store'
import { hoje, formatarDataBR, diasDesde, getMesAtual } from '@/lib/utils'
import type { TabId } from '@/types'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Home() {
  const { agendamentos, clientes, atendimentos, meta, setTab } = useStore()
  const hj = hoje()
  const mes = getMesAtual()

  const agHoje = useMemo(() =>
    agendamentos.filter(a => a.data === hj && a.status !== 'cancelado')
      .sort((a,b) => a.hora.localeCompare(b.hora)),
    [agendamentos, hj]
  )

  const faturamento = useMemo(() =>
    atendimentos.filter(a => a.data?.startsWith(mes)).reduce((s,a) => s + (a.valorLiquido || a.valor || 0), 0),
    [atendimentos, mes]
  )

  const semRetorno = useMemo(() =>
    clientes.filter(c => {
      const ult = atendimentos.filter(a => a.clienteId === c.id).sort((a,b) => b.data.localeCompare(a.data))[0]
      const d = diasDesde(ult?.data || c.criadoEm || '')
      return d !== null && d >= 30
    }).length,
    [clientes, atendimentos]
  )

  const metaPct = meta > 0 ? Math.min(100, Math.round(faturamento / meta * 100)) : 0
  const STATUS_COR: Record<string,string> = { agendado:'var(--verde)', concluido:'var(--alerta)', pago:'var(--azul)' }
  const STATUS_L: Record<string,string>   = { agendado:'Agendado', concluido:'COBRAR', pago:'Pago' }

  return (
    <div style={{ paddingTop:'4px' }}>
      {/* Saudação */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', color:'var(--dim)', fontWeight:500 }}>{saudacao()},</div>
        <div style={{ fontSize:'26px', fontWeight:700, lineHeight:1.2, marginTop:'2px' }}>Caio 👋</div>
      </div>

      {/* 4 cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
        <Card icon="💰" val={`R$${faturamento.toFixed(0)}`} label="Este mês" sub={meta > 0 ? `${metaPct}% da meta` : 'Meta não definida'} cor="var(--verde)" />
        <Card icon="📅" val={String(agHoje.length)} label={agHoje.length === 1 ? 'Hoje' : 'Hoje'} cor={agHoje.length > 0 ? 'var(--verde)' : 'var(--dim)'} />
        <Card icon="👥" val={String(clientes.length)} label="Clientes" onClick={() => setTab('clientes')} />
        <Card icon="🔔" val={String(semRetorno)} label="Sem retorno 30d" cor={semRetorno > 0 ? 'var(--alerta)' : 'var(--verde)'} onClick={() => setTab('clientes')} />
      </div>

      {/* Meta bar */}
      {meta > 0 && (
        <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'12px', color:'var(--dim)', fontWeight:600 }}>Meta R${meta}</span>
            <span style={{ fontSize:'12px', fontWeight:700, color:metaPct>=100?'var(--verde)':metaPct>=60?'var(--alerta)':'var(--erro)' }}>{metaPct}%</span>
          </div>
          <div style={{ height:'5px', background:'var(--borda)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${metaPct}%`, borderRadius:'3px', transition:'width .5s ease', background:metaPct>=100?'var(--verde)':metaPct>=60?'var(--alerta)':'var(--erro)' }} />
          </div>
          {metaPct < 100 && <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'6px' }}>Faltam R${(meta-faturamento).toFixed(0)}</div>}
        </div>
      )}

      {/* Agenda de hoje */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'1px' }}>Hoje</div>
          <button onClick={() => setTab('agenda')} style={{ background:'none', border:'none', color:'var(--verde)', fontSize:'12px', fontWeight:600, cursor:'pointer', padding:0 }}>Ver tudo →</button>
        </div>

        {agHoje.length === 0 ? (
          <div style={{ background:'var(--s1)', border:'1px dashed var(--borda)', borderRadius:'var(--r)', padding:'24px', textAlign:'center' }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>📅</div>
            <div style={{ fontSize:'13px', color:'var(--dim)' }}>Nenhum agendamento hoje</div>
          </div>
        ) : agHoje.map(ag => {
          const c = clientes.find(x => x.id === ag.clienteId)
          const cor = STATUS_COR[ag.status] || 'var(--verde)'
          const isCobrar = ag.status === 'concluido'
          return (
            <div key={ag.id} onClick={() => setTab('agenda')}
              style={{ background:'var(--s1)', borderRadius:'var(--r)', padding:'13px', marginBottom:'8px', cursor:'pointer', borderLeft:`3px solid ${cor}`, border:`0.5px solid var(--borda)`, borderLeftWidth:'3px', borderLeftColor:cor }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:600 }}>{c?.nome || 'Cliente'}</div>
                  <div style={{ fontSize:'12px', color:'var(--dim)', marginTop:'3px' }}>{ag.hora} · {ag.servico}</div>
                  <span style={{ marginTop:'5px', display:'inline-block', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px', background:`${cor}18`, color:cor, border:`1px solid ${cor}44` }}>
                    {STATUS_L[ag.status] || ag.status}
                  </span>
                </div>
                <div style={{ textAlign:'right' }}>
                  {(ag.valorAcordado || 0) > 0 && <div style={{ fontSize:'17px', fontWeight:700, color:cor }}>R${ag.valorAcordado}</div>}
                  {isCobrar && <div style={{ marginTop:'6px', background:'var(--alerta)', color:'#000', fontSize:'11px', fontWeight:700, padding:'5px 10px', borderRadius:'8px' }}>COBRAR</div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ações rápidas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        {([
          { icon:'📅', label:'Abrir Agenda',  tab:'agenda'     as TabId },
          { icon:'👥', label:'Clientes',       tab:'clientes'   as TabId },
          { icon:'💰', label:'Financeiro',     tab:'financeiro' as TabId },
          { icon:'⚙️', label:'Config',         tab:'config'     as TabId },
        ] as {icon:string;label:string;tab:TabId}[]).map(a => (
          <button key={a.tab} onClick={() => setTab(a.tab)} style={{
            padding:'14px 12px', borderRadius:'var(--r)', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'10px',
            background:'var(--s1)', border:'0.5px solid var(--borda)',
            color:'var(--txt)', fontSize:'13px', fontWeight:600, textAlign:'left',
          }}>
            <span style={{ fontSize:'20px' }}>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Card({ icon, val, label, sub, cor, onClick }: { icon:string; val:string; label:string; sub?:string; cor?:string; onClick?:()=>void }) {
  return (
    <div onClick={onClick} style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'13px 12px', cursor:onClick?'pointer':'default' }}>
      <div style={{ fontSize:'20px', marginBottom:'6px' }}>{icon}</div>
      <div style={{ fontSize:'20px', fontWeight:700, color:cor||'var(--txt)', lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'4px', fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:'10px', color:'var(--dim)', marginTop:'2px', opacity:.8 }}>{sub}</div>}
    </div>
  )
}
