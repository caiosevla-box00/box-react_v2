import React, { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { db, COLS, doc, setDoc } from '@/lib/firebase'
import { serverTimestamp } from 'firebase/firestore'
import { SERVICOS, CATEGORIAS, TEMPO_SERVICO } from '@/lib/servicos'
import { gerarId, hoje, formatarDataBR } from '@/lib/utils'
import type { Agendamento, Cliente } from '@/types'

type Etapa = 'servicos' | 'acao' | 'cliente_pdf' | 'cliente_ag' | 'novo_cliente' | 'agendar'
const TIPOS_V_L: Record<string,string> = { hatch:'🚗 Hatch', sedan:'🚙 Sedan', suv:'🛻 SUV' }
const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export function NovoOrcamento({ onFechar }: { onFechar: () => void }) {
  const { veiculo, setVeiculo, precos, custoPorKm, servicosCustom, clientes, setClientes, agendamentos, setAgendamentos, toast_show } = useStore()
  const [etapa, setEtapa] = useState<Etapa>('servicos')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [delivery, setDelivery] = useState(false)
  const [km, setKm] = useState<number|''>('')
  const [pedagio, setPedagio] = useState<number|''>('')
  const [alimentacao, setAlimentacao] = useState<number|''>('')
  const [taxaDelCustom, setTaxaDelCustom] = useState<number|''>('')
  const [desconto, setDesconto] = useState<number|''>('')
  const [busca, setBusca] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoTel, setNovoTel] = useState('')
  const [novoMarca, setNovoMarca] = useState('')
  const [novoModelo, setNovoModelo] = useState('')
  const [agData, setAgData] = useState(hoje())
  const [agHora, setAgHora] = useState('')
  const [agSvcId, setAgSvcId] = useState(SERVICOS[0].id)
  const [agObs, setAgObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const isPdf = etapa === 'cliente_pdf'

  const kmN=Number(km)||0, pedagioN=Number(pedagio)||0, alimentacaoN=Number(alimentacao)||0
  const custoReal=custoPorKm*kmN, custoDesl=Math.ceil(custoReal*1.5)
  const taxaDelSug=custoDesl+pedagioN+alimentacaoN
  const taxaDelFinal=taxaDelCustom!==''?Number(taxaDelCustom):taxaDelSug
  const descontoN=Number(desconto)||0
  const getP=(id:string)=>{ const c=servicosCustom.find(s=>s.id===id); if(c) return (c as any)[veiculo]??c.hatch; return precos[id]?.[veiculo]??SERVICOS.find(s=>s.id===id)?.base[veiculo]??0 }
  const subtotal=useMemo(()=>Array.from(sel).reduce((a,id)=>a+getP(id),0),[sel,veiculo,precos])
  const total=subtotal+(delivery?taxaDelFinal:0)-descontoN
  const clientesFil=busca?clientes.filter(c=>c.nome?.toLowerCase().includes(busca.toLowerCase())||(c.tel||'').includes(busca)):clientes
  const clienteSel=clientes.find(c=>c.id===clienteId)
  function tog(id:string){setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})}

  async function salvarNovoCliente(destino:'ag'|'pdf'){
    if(!novoNome.trim()){toast_show('⚠️ Nome obrigatório');return}
    const novo:Cliente={id:gerarId(),nome:novoNome.trim(),tel:novoTel,marca:novoMarca,modelo:novoModelo,tipoVeiculo:veiculo,criadoEm:hoje()}
    setClientes([novo,...clientes])
    await setDoc(doc(db,COLS.clientes,novo.id),{...novo,criadoEm:serverTimestamp()})
    setClienteId(novo.id); toast_show('✅ Cliente salvo!')
    if(destino==='ag') setEtapa('agendar')
    else{await gerarPDF(novo);setEtapa('acao')}
  }

  async function gerarPDF(c?:Cliente){
    const {gerarOrcamentoPDF}=await import('@/lib/orcamentoPDF')
    const cli=c||clientes.find(x=>x.id===clienteId)
    gerarOrcamentoPDF({cliente:cli?{nome:cli.nome,veiculo:[cli.marca,cli.modelo].filter(Boolean).join(' ')}:undefined,svcIds:Array.from(sel),servicosCustom,veiculo,total,delivery:delivery?taxaDelFinal:0,desconto:descontoN})
  }

  async function confirmarAg(){
    if(!clienteId){toast_show('⚠️ Selecione cliente');return}
    if(!agData||!agHora){toast_show('⚠️ Data e horário obrigatórios');return}
    setSalvando(true)
    const svcNome=servicosCustom.find(s=>s.id===agSvcId)?.nome||SERVICOS.find(s=>s.id===agSvcId)?.nome||''
    const ag:Agendamento={id:gerarId(),clienteId,data:agData,hora:agHora,duracao:TEMPO_SERVICO[agSvcId]||60,
      servico:sel.size>1?Array.from(sel).map(id=>servicosCustom.find(s=>s.id===id)?.nome||SERVICOS.find(s=>s.id===id)?.nome||id).join(' + '):svcNome,
      svcIds:Array.from(sel),obs:agObs,status:'agendado',valorAcordado:total,criadoEm:hoje()}
    setAgendamentos([ag,...agendamentos])
    await setDoc(doc(db,COLS.agendamentos,ag.id),{...ag,criadoEm:serverTimestamp()})
    setSalvando(false); toast_show('📅 Agendamento salvo!')
    const c=clientes.find(x=>x.id===clienteId)
    if(c?.tel){
      const dt=new Date(agData+'T12:00:00')
      const msg=`Olá ${c.nome?.split(' ')[0]}! 🚗✨\nAgendamento confirmado!\n📅 ${DIAS[dt.getDay()]}, ${formatarDataBR(agData)}\n⏰ ${agHora}\n🔧 ${ag.servico}\n📍 BOX 0.0`
      const tel=(c.tel).replace(/\D/g,'')
      setTimeout(()=>{if(confirm(`Enviar WhatsApp para ${c.nome?.split(' ')[0]}?`))window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`,'_blank');onFechar()},100)
    } else onFechar()
  }

  const inp:React.CSSProperties={width:'100%',background:'var(--bg)',border:'1px solid var(--borda)',borderRadius:'var(--r)',padding:'11px 14px',color:'var(--txt)',outline:'none',fontSize:'15px'}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:600,color:'var(--dim)',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:'6px',marginTop:'12px'}
  const back=(to:Etapa)=><button onClick={()=>setEtapa(to)} style={{background:'var(--s1)',border:'1px solid var(--borda)',color:'var(--txt)',padding:'7px 13px',borderRadius:10,cursor:'pointer',fontSize:13}}>‹ Voltar</button>

  if(etapa==='servicos') return (
    <div style={{position:'fixed',inset:0,zIndex:10010,background:'var(--bg)',overflowY:'auto'}}>
      <div style={{maxWidth:'500px',margin:'0 auto',padding:'16px 16px 160px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'18px',fontWeight:700}}>Novo Orçamento</div>
          <button onClick={onFechar} style={{background:'var(--s1)',border:'1px solid var(--borda)',color:'var(--txt)',padding:'7px 13px',borderRadius:10,cursor:'pointer',fontSize:13}}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:16}}>
          {(['hatch','sedan','suv'] as const).map(v=>(
            <button key={v} onClick={()=>setVeiculo(v)} style={{padding:'10px 4px',borderRadius:'var(--r)',fontSize:12,fontWeight:600,border:'none',cursor:'pointer',background:veiculo===v?'var(--verde)':'var(--s1)',color:veiculo===v?'#000':'var(--dim)',outline:veiculo===v?'none':'1px solid var(--borda)'}}>{TIPOS_V_L[v]}</button>
          ))}
        </div>
        {CATEGORIAS.map(cat=>(
          <div key={cat.nome}>
            <div style={{fontSize:'11px',fontWeight:600,color:'var(--dim)',letterSpacing:'1px',textTransform:'uppercase',margin:'14px 0 8px'}}>{cat.nome}</div>
            {cat.ids.map(id=>{const s=SERVICOS.find(x=>x.id===id)!;const on=sel.has(id);return(
              <button key={id} onClick={()=>tog(id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:12,borderRadius:'var(--r)',marginBottom:6,background:on?'var(--vbg)':'var(--s1)',border:`1.5px solid ${on?'var(--verde)':'var(--borda)'}`,cursor:'pointer',textAlign:'left'}}>
                <div style={{width:22,height:22,borderRadius:6,background:on?'var(--verde)':'transparent',border:`1.5px solid ${on?'var(--verde)':'#555'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#000',fontWeight:700,flexShrink:0}}>{on?'✓':''}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:'var(--txt)'}}>{s.nome}</div><div style={{fontSize:11,color:'var(--dim)',marginTop:2}}>{s.tempo}</div></div>
                <div style={{fontSize:17,fontWeight:700,color:on?'var(--verde)':'var(--dim)',flexShrink:0}}>R${getP(id)}</div>
              </button>
            )})}
          </div>
        ))}
        {servicosCustom.length>0&&(
          <div>
            <div style={{fontSize:'11px',fontWeight:600,color:'var(--verde)',letterSpacing:'1px',textTransform:'uppercase',margin:'14px 0 8px'}}>✨ Meus Serviços</div>
            {servicosCustom.map(s=>{const on=sel.has(s.id);return(
              <button key={s.id} onClick={()=>tog(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:12,borderRadius:'var(--r)',marginBottom:6,background:on?'var(--vbg)':'var(--s1)',border:`1.5px solid ${on?'var(--verde)':'var(--borda)'}`,cursor:'pointer',textAlign:'left'}}>
                <div style={{width:22,height:22,borderRadius:6,background:on?'var(--verde)':'transparent',border:`1.5px solid ${on?'var(--verde)':'#555'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#000',fontWeight:700,flexShrink:0}}>{on?'✓':''}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:'var(--txt)'}}>{s.nome}</div><div style={{fontSize:11,color:'var(--dim)',marginTop:2}}>{s.tempo}</div></div>
                <div style={{fontSize:17,fontWeight:700,color:on?'var(--verde)':'var(--dim)',flexShrink:0}}>R${getP(s.id)}</div>
              </button>
            )})}
          </div>
        )}
        <div style={{marginTop:16,background:'var(--s1)',border:`1px solid ${delivery?'var(--verde)':'var(--borda)'}`,borderRadius:'var(--r)',padding:14,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:14,fontWeight:600}}>🚚 Delivery</div><div style={{fontSize:12,color:'var(--dim)',marginTop:2}}>{custoPorKm>0?`R$${custoPorKm.toFixed(2)}/km`:'Configure em Custos'}</div></div>
            <button onClick={()=>setDelivery(d=>!d)} style={{width:46,height:26,borderRadius:13,border:'none',cursor:'pointer',background:delivery?'var(--verde)':'#444',position:'relative'}}>
              <div style={{position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s',left:delivery?23:3}}/>
            </button>
          </div>
          {delivery&&(
            <div style={{marginTop:12}}>
              <label style={lbl}>Km</label>
              <input type="number" value={km} onChange={e=>{setKm(e.target.value===''?'':Number(e.target.value));setTaxaDelCustom('')}} placeholder="Ex: 8" style={{...inp,fontSize:22,fontWeight:700,textAlign:'center',marginBottom:8}}/>
              {kmN>0&&custoPorKm>0&&(
                <div style={{background:'var(--bg)',borderRadius:10,padding:'10px 12px',marginBottom:8,fontSize:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'var(--dim)'}}>Deslocamento +50%</span><span style={{color:'var(--dim)'}}>R${custoDesl}</span></div>
                  {pedagioN>0&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'var(--dim)'}}>Pedágio</span><span style={{color:'var(--dim)'}}>R${pedagioN}</span></div>}
                  {alimentacaoN>0&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'var(--dim)'}}>Alimentação</span><span style={{color:'var(--dim)'}}>R${alimentacaoN}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--borda)',paddingTop:6,marginTop:4}}><span style={{fontWeight:600,color:'var(--verde)'}}>Total delivery</span><span style={{fontWeight:700,color:'var(--verde)',fontSize:16}}>R${taxaDelSug}</span></div>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div><label style={lbl}>Pedágio (R$)</label><input type="number" value={pedagio} onChange={e=>{setPedagio(e.target.value===''?'':Number(e.target.value));setTaxaDelCustom('')}} placeholder="0" style={{...inp,textAlign:'center',fontWeight:700}}/></div>
                <div><label style={lbl}>Alimentação (R$)</label><input type="number" value={alimentacao} onChange={e=>{setAlimentacao(e.target.value===''?'':Number(e.target.value));setTaxaDelCustom('')}} placeholder="0" style={{...inp,textAlign:'center',fontWeight:700}}/></div>
              </div>
              <label style={lbl}>Valor cobrado do cliente</label>
              <input type="number" value={taxaDelCustom!==''?taxaDelCustom:taxaDelSug||''} onChange={e=>setTaxaDelCustom(e.target.value===''?'':Number(e.target.value))} placeholder="R$" style={{...inp,fontSize:22,fontWeight:700,color:'var(--verde)',border:'2px solid var(--verde)',textAlign:'center'}}/>
            </div>
          )}
        </div>
        <div style={{background:'var(--s1)',border:'1px solid var(--borda)',borderRadius:'var(--r)',padding:14}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>Desconto</div><div style={{fontSize:12,color:'var(--dim)',marginTop:2}}>Valor a deduzir</div></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13,color:'var(--dim)'}}>R$</span><input type="number" value={desconto} onChange={e=>setDesconto(e.target.value===''?'':Number(e.target.value))} placeholder="0" style={{width:80,background:'var(--bg)',border:'1px solid var(--borda)',borderRadius:10,padding:'7px 10px',color:'var(--erro)',fontSize:17,fontWeight:700,outline:'none',textAlign:'center'}}/></div>
          </div>
        </div>
      </div>
      {sel.size>0&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,maxWidth:'500px',margin:'0 auto',background:'var(--s2)',borderTop:'1px solid var(--borda)',padding:'12px 16px 28px',zIndex:90}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div><div style={{fontSize:12,color:'var(--dim)'}}>{sel.size} serviço{sel.size!==1?'s':''}</div><div style={{fontSize:28,fontWeight:800,color:'var(--verde)',lineHeight:1}}>R${total}</div></div>
            <button onClick={()=>{setSel(new Set());setDelivery(false);setKm('');setPedagio('');setAlimentacao('');setTaxaDelCustom('');setDesconto('')}} style={{background:'transparent',border:'1px solid var(--borda)',borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:600,color:'var(--dim)',cursor:'pointer'}}>🗑 Limpar</button>
          </div>
          <button onClick={()=>setEtapa('acao')} style={{width:'100%',background:'var(--verde)',color:'#000',fontSize:15,fontWeight:700,padding:15,borderRadius:'var(--r)',border:'none',cursor:'pointer',letterSpacing:'1px'}}>FECHAR SERVIÇO →</button>
        </div>
      )}
    </div>
  )

  if(etapa==='acao') return (
    <div style={{position:'fixed',inset:0,zIndex:10010,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onFechar()}>
      <div className="slide-up" style={{width:'100%',maxWidth:'500px',background:'var(--s2)',borderRadius:'20px 20px 0 0',padding:'8px 20px 40px'}}>
        <div style={{width:36,height:4,background:'var(--borda)',borderRadius:2,margin:'10px auto 20px'}}/>
        <div style={{background:'var(--vbg)',border:'1px solid var(--verde)',borderRadius:14,padding:14,marginBottom:20}}>
          <div style={{fontSize:12,color:'var(--vdim)',marginBottom:4}}>{sel.size} serviço{sel.size!==1?'s':''} · {TIPOS_V_L[veiculo]}</div>
          <div style={{fontSize:28,fontWeight:800,color:'var(--verde)',lineHeight:1}}>R${total}</div>
          {delivery&&taxaDelFinal>0&&<div style={{fontSize:12,color:'var(--dim)',marginTop:4}}>Inclui delivery R${taxaDelFinal}</div>}
          {descontoN>0&&<div style={{fontSize:12,color:'var(--erro)',marginTop:2}}>Desconto -R${descontoN}</div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button onClick={()=>{setBusca('');setEtapa('cliente_pdf')}} style={{padding:16,borderRadius:14,border:'1px solid var(--borda)',background:'var(--s1)',color:'var(--txt)',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><span style={{fontSize:24}}>📄</span>Gerar PDF</button>
          <button onClick={()=>{setBusca('');setEtapa('cliente_ag')}} style={{padding:16,borderRadius:14,border:'none',background:'var(--verde)',color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><span style={{fontSize:24}}>📅</span>Agendar</button>
        </div>
        <button onClick={()=>setEtapa('servicos')} style={{width:'100%',marginTop:10,padding:10,background:'transparent',border:'none',color:'var(--dim)',fontSize:13,cursor:'pointer'}}>← Voltar ao orçamento</button>
      </div>
    </div>
  )

  if(etapa==='cliente_pdf'||etapa==='cliente_ag') return (
    <div style={{position:'fixed',inset:0,zIndex:10010,background:'var(--bg)',overflowY:'auto'}}>
      <div style={{maxWidth:'500px',margin:'0 auto',padding:'20px 16px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>{back('acao')}<div style={{fontSize:16,fontWeight:700}}>{isPdf?'Cliente do PDF':'Selecionar Cliente'}</div><div style={{width:70}}/></div>
        {isPdf&&<button onClick={()=>{gerarPDF();setEtapa('acao')}} style={{width:'100%',padding:'11px 14px',borderRadius:12,marginBottom:10,border:'1px solid var(--borda)',background:'var(--s1)',color:'var(--dim)',fontSize:14,cursor:'pointer'}}>Gerar sem cliente específico</button>}
        <div style={{background:'var(--s1)',border:'1px solid var(--borda)',borderRadius:12,padding:'10px 14px',display:'flex',gap:8,alignItems:'center',marginBottom:10}}><span>🔍</span><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{background:'none',border:'none',color:'var(--txt)',fontSize:15,width:'100%',outline:'none'}}/></div>
        <button onClick={()=>{setNovoNome('');setNovoTel('');setNovoMarca('');setNovoModelo('');setEtapa('novo_cliente')}} style={{width:'100%',padding:'11px 14px',borderRadius:12,marginBottom:10,border:'1px dashed var(--verde)',background:'var(--vbg)',color:'var(--verde)',fontSize:14,fontWeight:600,cursor:'pointer'}}>+ Criar novo cliente</button>
        {clientesFil.map(c=>(
          <button key={c.id} onClick={()=>{setClienteId(c.id);if(isPdf){gerarPDF(c);setEtapa('acao')}else setEtapa('agendar')}} style={{width:'100%',textAlign:'left',background:'var(--s1)',border:`1.5px solid ${clienteId===c.id?'var(--verde)':'var(--borda)'}`,borderRadius:14,padding:13,marginBottom:8,cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:'var(--vbg)',border:'1.5px solid var(--verde)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--verde)',flexShrink:0}}>{c.nome[0].toUpperCase()}</div>
              <div><div style={{fontSize:15,fontWeight:600,color:'var(--txt)'}}>{c.nome}</div><div style={{fontSize:12,color:'var(--dim)',marginTop:2}}>{c.tel}{c.marca?` · ${c.marca} ${c.modelo||''}`:''}</div></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  if(etapa==='novo_cliente') return (
    <div style={{position:'fixed',inset:0,zIndex:10011,background:'var(--bg)',overflowY:'auto'}}>
      <div style={{maxWidth:'500px',margin:'0 auto',padding:'20px 16px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>{back(isPdf?'cliente_pdf':'cliente_ag')}<div style={{fontSize:16,fontWeight:700}}>Novo Cliente</div><div style={{width:70}}/></div>
        <label style={lbl}>Nome *</label><input value={novoNome} onChange={e=>setNovoNome(e.target.value)} placeholder="Nome completo" style={inp}/>
        <label style={lbl}>Telefone</label><input type="tel" value={novoTel} onChange={e=>setNovoTel(e.target.value)} placeholder="(11) 99999-9999" style={inp}/>
        <label style={lbl}>Marca</label><input value={novoMarca} onChange={e=>setNovoMarca(e.target.value)} placeholder="Ex: Hyundai" style={inp}/>
        <label style={lbl}>Modelo</label><input value={novoModelo} onChange={e=>setNovoModelo(e.target.value)} placeholder="Ex: HB20" style={inp}/>
        <button onClick={()=>salvarNovoCliente(isPdf?'pdf':'ag')} style={{width:'100%',marginTop:24,padding:15,borderRadius:14,background:'var(--verde)',color:'#000',border:'none',fontSize:15,fontWeight:700,cursor:'pointer'}}>SALVAR E CONTINUAR →</button>
      </div>
    </div>
  )

  if(etapa==='agendar') return (
    <div style={{position:'fixed',inset:0,zIndex:10010,background:'var(--bg)',overflowY:'auto'}}>
      <div style={{maxWidth:'500px',margin:'0 auto',padding:'20px 16px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>{back('cliente_ag')}<div style={{fontSize:16,fontWeight:700}}>Agendar</div><div style={{width:70}}/></div>
        {clienteSel&&<div style={{background:'var(--vbg)',border:'1px solid var(--verde)',borderRadius:14,padding:12,marginBottom:16,display:'flex',alignItems:'center',gap:12}}><div style={{width:38,height:38,borderRadius:10,background:'var(--vbg)',border:'1.5px solid var(--verde)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{clienteSel.nome[0].toUpperCase()}</div><div><div style={{fontSize:14,fontWeight:600}}>{clienteSel.nome}</div><div style={{fontSize:12,color:'var(--dim)'}}>{clienteSel.marca} {clienteSel.modelo}</div></div></div>}
        <label style={lbl}>Serviço principal</label>
        <select value={agSvcId} onChange={e=>setAgSvcId(e.target.value)} style={{...inp,appearance:'auto'} as any}>{SERVICOS.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}{servicosCustom.map(s=><option key={s.id} value={s.id}>{s.nome} ✨</option>)}</select>
        <div style={{background:'var(--s1)',border:'1px solid var(--borda)',borderRadius:12,padding:'10px 14px',marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:13,color:'var(--dim)'}}>Valor acordado</span><span style={{fontSize:20,fontWeight:700,color:'var(--verde)'}}>R${total}</span></div>
        <label style={lbl}>Data</label><input type="date" value={agData} onChange={e=>setAgData(e.target.value)} style={inp}/>
        <label style={lbl}>Horário</label><input type="time" value={agHora} onChange={e=>setAgHora(e.target.value)} step={1800} style={inp}/>
        {agData&&<div style={{marginTop:10}}><div style={{fontSize:11,color:'var(--dim)',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Slots disponíveis</div><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:4}}>{Array.from({length:20},(_,i)=>{const min=i*30,h=8+Math.floor(min/60),m=min%60,slot=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,ocupado=agendamentos.some(a=>a.data===agData&&a.hora===slot&&a.status!=='cancelado'),ativo=agHora===slot;return<button key={slot} onClick={()=>!ocupado&&setAgHora(slot)} style={{padding:'6px 2px',borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${ativo?'var(--verde)':ocupado?'transparent':'rgba(170,255,0,.3)'}`,background:ativo?'var(--verde)':ocupado?'var(--s1)':'var(--vbg)',color:ativo?'#000':ocupado?'var(--dim)':'var(--verde)',cursor:ocupado?'not-allowed':'pointer',opacity:ocupado?.4:1}}>{slot}</button>})}</div></div>}
        <label style={lbl}>Observações</label><input value={agObs} onChange={e=>setAgObs(e.target.value)} placeholder="Ex: Cliente vem às 15h" style={inp}/>
        <button onClick={confirmarAg} disabled={salvando} style={{width:'100%',marginTop:20,padding:15,borderRadius:14,background:salvando?'var(--dim)':'var(--verde)',color:'#000',border:'none',fontSize:15,fontWeight:700,cursor:salvando?'not-allowed':'pointer'}}>{salvando?'Salvando...':'✅ CONFIRMAR AGENDAMENTO'}</button>
      </div>
    </div>
  )
  return null
}
