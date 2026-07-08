import React, { useState, useMemo } from 'react'

interface Produto {
  id: string
  nome: string
  diluicoes: { label: string; ratio: number; uso: string }[]
}

const PRODUTOS: Produto[] = [
  { id:'shampoo', nome:'Shampoo Automotivo', diluicoes:[
    { label:'Lavagem normal', ratio:400, uso:'Lavagem geral' },
    { label:'Lavagem pesada', ratio:200, uso:'Muito sujo' },
    { label:'Pré-lavagem',    ratio:100, uso:'Desencruste pesado' },
  ]},
  { id:'apc', nome:'APC (Limpador Multiuso)', diluicoes:[
    { label:'Bancos/tapetes',  ratio:10,  uso:'Tecidos internos' },
    { label:'Painel/plásticos',ratio:5,   uso:'Superfícies internas' },
    { label:'Motor/externo',   ratio:3,   uso:'Sujeira pesada' },
  ]},
  { id:'desengrax', nome:'Desengraxante', diluicoes:[
    { label:'Leve',    ratio:20, uso:'Manutenção' },
    { label:'Médio',   ratio:10, uso:'Normal' },
    { label:'Pesado',  ratio:5,  uso:'Motor, chassis' },
  ]},
  { id:'revit', nome:'Revitalizador de Plásticos', diluicoes:[
    { label:'Interno', ratio:3, uso:'Painel, console' },
    { label:'Externo', ratio:2, uso:'Para-choques, frisos' },
  ]},
  { id:'cera', nome:'Cera Líquida', diluicoes:[
    { label:'Aplicação', ratio:1, uso:'Aplicar puro' },
  ]},
  { id:'desinf', nome:'Desinfetante/Higienizador', diluicoes:[
    { label:'Bancos',  ratio:50,  uso:'Tecidos' },
    { label:'Painel',  ratio:30,  uso:'Superfícies' },
    { label:'Tapetes', ratio:20,  uso:'Higienização profunda' },
  ]},
]

export function Diluidor() {
  const [prodId, setProdId] = useState(PRODUTOS[0].id)
  const [diluicaoIdx, setDiluicaoIdx] = useState(0)
  const [modo, setModo] = useState<'produto'|'final'>('produto')
  const [qtd, setQtd] = useState('')

  const prod = PRODUTOS.find(p => p.id === prodId)!
  const dil = prod.diluicoes[diluicaoIdx] || prod.diluicoes[0]
  const qtdN = Number(qtd) || 0

  const { produtoMl, aguaMl, finalMl } = useMemo(() => {
    if (modo === 'produto') {
      const produtoMl = qtdN
      const aguaMl = qtdN * dil.ratio
      const finalMl = qtdN + aguaMl
      return { produtoMl, aguaMl, finalMl }
    } else {
      const produtoMl = qtdN / (dil.ratio + 1)
      const aguaMl = qtdN - produtoMl
      const finalMl = qtdN
      return { produtoMl, aguaMl, finalMl }
    }
  }, [qtdN, dil.ratio, modo])

  function fmt(ml: number) {
    if (ml === 0) return '—'
    if (ml >= 1000) return `${(ml/1000).toFixed(2)}L`
    return `${Math.round(ml)}ml`
  }

  return (
    <div>
      <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'6px' }}>Diluidor</div>
      <div style={{ fontSize:'13px', color:'var(--dim)', marginBottom:'20px' }}>Calculadora de diluição de produtos</div>

      {/* Produto */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>Produto</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
          {PRODUTOS.map(p => (
            <button key={p.id} onClick={() => { setProdId(p.id); setDiluicaoIdx(0); setQtd('') }}
              style={{ padding:'11px 10px', borderRadius:'var(--r)', fontSize:'13px', fontWeight:600, textAlign:'left', border:`1.5px solid ${prodId===p.id?'var(--verde)':'var(--borda)'}`, background:prodId===p.id?'var(--vbg)':'var(--s1)', color:prodId===p.id?'var(--verde)':'var(--txt)', cursor:'pointer' }}>
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de diluição */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>Tipo de uso</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {prod.diluicoes.map((d, i) => (
            <button key={i} onClick={() => { setDiluicaoIdx(i); setQtd('') }}
              style={{ padding:'12px 14px', borderRadius:'var(--r)', fontSize:'13px', textAlign:'left', border:`1.5px solid ${diluicaoIdx===i?'var(--verde)':'var(--borda)'}`, background:diluicaoIdx===i?'var(--vbg)':'var(--s1)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600, color:diluicaoIdx===i?'var(--verde)':'var(--txt)' }}>{d.label}</div>
                <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'2px' }}>{d.uso}</div>
              </div>
              <div style={{ fontSize:'12px', fontWeight:700, color:diluicaoIdx===i?'var(--verde)':'var(--dim)', background:diluicaoIdx===i?'var(--verde-bg)':'var(--bg)', padding:'4px 10px', borderRadius:'20px' }}>
                1:{d.ratio}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modo */}
      <div style={{ display:'flex', gap:'4px', background:'var(--s1)', padding:'4px', borderRadius:'var(--r)', marginBottom:'16px' }}>
        <button onClick={() => { setModo('produto'); setQtd('') }} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, background:modo==='produto'?'var(--verde)':'transparent', color:modo==='produto'?'#000':'var(--dim)' }}>
          Tenho o produto
        </button>
        <button onClick={() => { setModo('final'); setQtd('') }} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, background:modo==='final'?'var(--verde)':'transparent', color:modo==='final'?'#000':'var(--dim)' }}>
          Quero X ml final
        </button>
      </div>

      {/* Input */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' }}>
          {modo === 'produto' ? 'Quanto de produto (ml)?' : 'Quanto de mistura final (ml)?'}
        </div>
        <input type="number" value={qtd} onChange={e => setQtd(e.target.value)} placeholder="Ex: 50"
          style={{ width:'100%', background:'var(--bg)', border:'2px solid var(--verde)', borderRadius:'var(--r)', padding:'14px', color:'var(--verde)', fontSize:'28px', fontWeight:700, outline:'none', textAlign:'center' }} />
      </div>

      {/* Resultado */}
      {qtdN > 0 && (
        <div style={{ background:'var(--vbg)', border:'1px solid var(--verde)', borderRadius:'var(--r)', padding:'16px', marginBottom:'16px' }}>
          <div style={{ fontSize:'11px', fontWeight:600, color:'var(--vdim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'12px' }}>
            Resultado — Diluição 1:{dil.ratio}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
            {[
              { label:'Produto', val:fmt(produtoMl), cor:'var(--verde)' },
              { label:'Água',    val:fmt(aguaMl),    cor:'var(--azul)'  },
              { label:'Total',   val:fmt(finalMl),   cor:'var(--txt)'   },
            ].map((r,i) => (
              <div key={i} style={{ background:'var(--bg)', borderRadius:'10px', padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:'18px', fontWeight:700, color:r.cor }}>{r.val}</div>
                <div style={{ fontSize:'11px', color:'var(--dim)', marginTop:'4px' }}>{r.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'12px', fontSize:'12px', color:'var(--vdim)', textAlign:'center' }}>
            Para cada {fmt(produtoMl)} de produto → adicione {fmt(aguaMl)} de água
          </div>
        </div>
      )}

      {/* Tabela de referência */}
      <div style={{ background:'var(--s1)', border:'0.5px solid var(--borda)', borderRadius:'var(--r)', padding:'14px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
          Referência rápida — {prod.nome}
        </div>
        {[50, 100, 250, 500, 1000].map(ml => {
          const pMl = ml / (dil.ratio + 1)
          const aMl = ml - pMl
          return (
            <div key={ml} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid var(--borda)' }}>
              <span style={{ fontSize:'13px', color:'var(--dim)' }}>Para {fmt(ml)} total</span>
              <span style={{ fontSize:'13px', color:'var(--txt)' }}>
                <span style={{ color:'var(--verde)', fontWeight:600 }}>{fmt(pMl)}</span> produto + <span style={{ color:'var(--azul)', fontWeight:600 }}>{fmt(aMl)}</span> água
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
