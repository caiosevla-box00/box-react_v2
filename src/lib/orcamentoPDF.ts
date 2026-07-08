import { SERVICOS } from './servicos'
import type { ServicoCustom } from '@/types'

export interface OrcamentoPDFDados {
  cliente?: { nome: string; veiculo?: string }
  svcIds: string[]
  servicosCustom?: ServicoCustom[]
  veiculo?: 'hatch'|'sedan'|'suv'
  total: number
  delivery?: number
  desconto?: number
  formaPagamento?: string
  parcelas?: number
  valorCobrado?: number
  taxaPct?: number
}

const PROCESSO = [
  { num:'01', titulo:'Avaliacao',     desc:'Inspecionamos cada detalhe do veiculo antes de comecar.' },
  { num:'02', titulo:'Execucao',      desc:'Produtos profissionais e tecnicas certificadas em cada etapa.' },
  { num:'03', titulo:'Inspecao final',desc:'Revisamos tudo antes de entregar — so liberamos quando esta perfeito.' },
  { num:'04', titulo:'Entrega',       desc:'Seu carro de volta impecavel, com orientacoes para manter o resultado.' },
]

export async function gerarOrcamentoPDF(dados: OrcamentoPDFDados): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit:'mm', format:'a4' })
  const W=210, M=18, C=W-M*2
  let y=0
  const VERDE:[number,number,number]=[90,191,0],PRETO:[number,number,number]=[12,12,12],BRANCO:[number,number,number]=[255,255,255],CINZA1:[number,number,number]=[245,245,245],CINZA2:[number,number,number]=[160,160,160],CINZA3:[number,number,number]=[80,80,80]
  const sf=(f:'normal'|'bold',sz:number,c:[number,number,number]=PRETO)=>{doc.setFont('helvetica',f);doc.setFontSize(sz);doc.setTextColor(...c)}
  const tx=(t:string,x:number,yy:number,o?:any)=>doc.text(t,x,yy,o)
  const hl=(yy:number)=>{doc.setDrawColor(...CINZA1);doc.setLineWidth(.3);doc.line(M,yy,W-M,yy)}

  doc.setFillColor(...PRETO); doc.rect(0,0,W,44,'F')
  doc.setFillColor(...VERDE); doc.rect(0,40,W,4,'F')
  sf('bold',26,BRANCO); tx('BOX',M,20); doc.setTextColor(...VERDE); tx(' 0.0',M+20,20)
  sf('normal',8,[160,160,160]); tx('ESTETICA AUTOMOTIVA  -  PADRAO DE QUALIDADE',M,29)
  const dataHoje=new Date().toLocaleDateString('pt-BR'), numOrc=`ORC-${Date.now().toString().slice(-6)}`
  sf('normal',8,[160,160,160]); tx(dataHoje,W-M,20,{align:'right'})
  sf('bold',9,VERDE); tx(numOrc,W-M,29,{align:'right'})
  y=58

  const primeiroNome=dados.cliente?.nome?.split(' ')[0]||'Cliente'
  sf('bold',16,PRETO); tx(`Ola, ${primeiroNome}!`,M,y); y+=7
  sf('normal',10,CINZA3)
  const veiculoTexto=dados.cliente?.veiculo?.replace(/[🚗🚙🛻]/g,'').trim()||''
  const saud=doc.splitTextToSize(`Preparei esse orcamento para o seu veiculo${veiculoTexto?` - ${veiculoTexto}`:''}.`+` Cada servico e executado com produtos profissionais e tecnica dedicada.`,C)
  doc.text(saud,M,y); y+=saud.length*5+8; hl(y); y+=8

  sf('bold',11,PRETO); tx('SERVICOS SELECIONADOS',M,y); doc.setFillColor(...VERDE); doc.rect(M,y+2,26,1,'F'); y+=10
  const veiculo=dados.veiculo||'hatch'
  const svcs=dados.svcIds.map(id=>{
    const custom=dados.servicosCustom?.find(s=>s.id===id)
    if(custom) return{nome:custom.nome,tempo:custom.tempo,preco:(custom as any)[veiculo]||custom.hatch,desc:custom.desc}
    const svc=SERVICOS.find(s=>s.id===id); if(!svc) return null
    return{nome:svc.nome,tempo:svc.tempo,preco:svc.base[veiculo],desc:svc.desc}
  }).filter(Boolean) as {nome:string;tempo:string;preco:number;desc:string}[]

  svcs.forEach(svc=>{
    const descLines=doc.splitTextToSize(svc.desc.replace(/[·•]/g,'-'),C-30)
    const cardH=10+descLines.length*4.5+4
    if(y+cardH>270){doc.addPage();y=20}
    doc.setFillColor(...CINZA1); doc.roundedRect(M,y,C,cardH,2,2,'F')
    doc.setFillColor(...VERDE); doc.roundedRect(M,y,3,cardH,1,1,'F')
    sf('bold',11,PRETO); tx(svc.nome,M+8,y+7)
    sf('normal',8,CINZA2); tx(`Duracao: ${svc.tempo}`,M+8,y+12)
    sf('bold',13,VERDE); tx(`R$${svc.preco}`,W-M-2,y+8,{align:'right'})
    sf('normal',8,CINZA3); doc.text(descLines,M+8,y+17)
    y+=cardH+4
  })
  y+=4

  if(y>220){doc.addPage();y=20}
  hl(y); y+=8; sf('bold',11,PRETO); tx('COMO TRABALHAMOS',M,y); doc.setFillColor(...VERDE); doc.rect(M,y+2,22,1,'F'); y+=10
  PROCESSO.forEach((p,i)=>{
    if(y>255){doc.addPage();y=20}
    doc.setFillColor(...PRETO); doc.circle(M+4,y+1,3.5,'F')
    sf('bold',8,BRANCO); tx(p.num,M+4,y+2.5,{align:'center'})
    sf('bold',10,PRETO); tx(p.titulo,M+12,y+2)
    sf('normal',8,CINZA3); const pL=doc.splitTextToSize(p.desc,C-16); doc.text(pL,M+12,y+7)
    y+=pL.length*4.5+8
    if(i<PROCESSO.length-1){doc.setDrawColor(...CINZA1);doc.setLineWidth(.5);doc.setLineDashPattern([1,1],0);doc.line(M+4,y-5,M+4,y-1);doc.setLineDashPattern([],0)}
  })
  y+=4

  if(y>230){doc.addPage();y=20}
  hl(y); y+=8
  if((dados.delivery||0)>0){sf('normal',9,CINZA3);tx('Taxa de Delivery',M,y);tx(`+R$${(dados.delivery||0).toFixed(2)}`,W-M,y,{align:'right'});y+=6}
  if((dados.desconto||0)>0){sf('normal',9,CINZA3);tx('Desconto',M,y);tx(`-R$${(dados.desconto||0).toFixed(2)}`,W-M,y,{align:'right'});y+=6}
  doc.setFillColor(...PRETO); doc.roundedRect(M,y,C,22,3,3,'F')
  sf('normal',9,[160,160,160]); tx('INVESTIMENTO TOTAL',M+6,y+7)
  sf('bold',20,VERDE); tx(`R$${(dados.valorCobrado||dados.total).toFixed(2)}`,W-M-6,y+14,{align:'right'})
  y+=30

  if(y>220){doc.addPage();y=20}
  hl(y); y+=8; sf('bold',11,PRETO); tx('FORMAS DE PAGAMENTO',M,y); doc.setFillColor(...VERDE); doc.rect(M,y+2,24,1,'F'); y+=10
  doc.setFillColor(240,255,220); doc.roundedRect(M,y,C,14,3,3,'F'); doc.setDrawColor(...VERDE); doc.setLineWidth(.5); doc.roundedRect(M,y,C,14,3,3,'S')
  sf('bold',10,PRETO); tx('PIX',M+6,y+9); sf('normal',9,CINZA3); tx('Sem taxa - Pagamento instantaneo',M+22,y+9); sf('bold',10,[90,191,0]); tx('SEM TAXA',W-M-4,y+9,{align:'right'}); y+=18
  doc.setFillColor(...CINZA1); doc.roundedRect(M,y,C,14,3,3,'F'); sf('bold',10,PRETO); tx('DEBITO',M+6,y+9); sf('normal',9,CINZA3); tx('Mastercard, Visa, Elo - InfinitePay',M+28,y+9); sf('bold',10,CINZA3); tx('1.5%',W-M-4,y+9,{align:'right'}); y+=18
  doc.setFillColor(...CINZA1); doc.roundedRect(M,y,C,14,3,3,'F'); sf('bold',10,PRETO); tx('CREDITO',M+6,y+5); sf('normal',8,CINZA3); tx('Mastercard, Visa, Elo, American Express',M+30,y+5); sf('bold',9,[180,120,0]); tx('Taxa consulte',W-M-4,y+5,{align:'right'}); sf('normal',8,CINZA3); tx('Parcelamento em ate 12x - taxas variam por parcela',M+6,y+11); y+=18

  if(y>240){doc.addPage();y=20}
  doc.setFillColor(240,255,220); doc.roundedRect(M,y,C,28,3,3,'F'); doc.setDrawColor(...VERDE); doc.setLineWidth(.5); doc.roundedRect(M,y,C,28,3,3,'S')
  sf('bold',12,PRETO); tx('Pronto para agendar?',M+6,y+9); sf('normal',9,CINZA3)
  const cta=doc.splitTextToSize('Responda esse orcamento confirmando os servicos ou me chame no WhatsApp. Agenda disponivel - garanta sua data!',C-12); doc.text(cta,M+6,y+15); y+=36

  if(y>260){doc.addPage();y=20}
  hl(y); y+=8; doc.setDrawColor(...PRETO); doc.setLineWidth(.4); doc.line(M,y+8,M+60,y+8)
  sf('bold',10,PRETO); tx('Caio Alves',M,y+14); sf('normal',8,CINZA2); tx('BOX 0.0 - Estetica Automotiva',M,y+19); tx(dataHoje,M,y+24)
  sf('normal',7,CINZA2); tx('Este orcamento tem validade de 7 dias a partir da data de emissao.',W/2,y+32,{align:'center'})

  const nomeCliente=dados.cliente?.nome?.replace(/\s/g,'-').toLowerCase()||'cliente'
  doc.save(`orcamento-${nomeCliente}-${dataHoje.replace(/\//g,'-')}.pdf`)
}
