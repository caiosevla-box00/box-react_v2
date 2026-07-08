export interface Servico {
  id: string; num: string; nome: string; tempo: string
  base: { hatch: number; sedan: number; suv: number }
  desc: string
}

export const SERVICOS: Servico[] = [
  { id:'start',    num:'01', nome:'Lavagem Start',             tempo:'1h – 1h30', base:{hatch:60,  sedan:72,  suv:78 }, desc:'Pré-lavagem com água e shampoo desencrustante - Lavagem com pH neutro - Secagem técnica com microfibra - Sopro de frestas - Pretinho nos pneus - Limpeza de painéis e plásticos internos' },
  { id:'perf',     num:'02', nome:'Lavagem Performance',       tempo:'2h – 2h30', base:{hatch:110, sedan:120, suv:130}, desc:'Tudo da Lavagem Start - Limpeza química de rodas e caixas de roda - Proteção UV dos plásticos internos' },
  { id:'resgate',  num:'03', nome:'Lavagem Resgate',           tempo:'4h – 5h',   base:{hatch:220, sedan:240, suv:260}, desc:'Tudo da Lavagem Performance - Detalhamento de emblemas - Proteção de plásticos externos - Cera de alta repelência' },
  { id:'interior', num:'04', nome:'Limpeza de Interior',       tempo:'1h30 – 2h', base:{hatch:90,  sedan:100, suv:110}, desc:'Limpeza completa de painel, console, portas, bancos e tapetes - Aspiração profunda' },
  { id:'higien',   num:'05', nome:'Higienização c/ Extratora', tempo:'3h – 4h',   base:{hatch:200, sedan:240, suv:250}, desc:'Higienização profunda com extratora - Remove odores, ácaros e bactérias dos tecidos' },
  { id:'teto',     num:'06', nome:'Limpeza de Teto',           tempo:'45min',     base:{hatch:60,  sedan:72,  suv:78 }, desc:'Produto específico no forro - Remove manchas e resíduos impregnados - Processo 100% manual' },
  { id:'couro',    num:'07', nome:'Revitalização de Couro',    tempo:'2h',        base:{hatch:60,  sedan:70,  suv:80 }, desc:'Limpeza profunda dos bancos em couro - Hidratação e proteção - Evita ressecamento' },
  { id:'cfarol',   num:'08', nome:'Clareamento de Faróis',     tempo:'45min',     base:{hatch:120, sedan:120, suv:120}, desc:'Lixamento progressivo - Polimento e selagem - Recupera a transparência original' },
  { id:'rfarol',   num:'09', nome:'Revitalização de Faróis',   tempo:'2h – 3h',   base:{hatch:280, sedan:280, suv:280}, desc:'Restauração completa com verniz UV - Resultado duradouro e proteção contra nova oxidação' },
  { id:'motor',    num:'10', nome:'Lavagem de Motor',           tempo:'1h',        base:{hatch:80,  sedan:80,  suv:80 }, desc:'Limpeza completa do compartimento - Remove graxa, óleo e resíduos acumulados' },
  { id:'descon',   num:'11', nome:'Descontaminação',            tempo:'1h',        base:{hatch:120, sedan:144, suv:156}, desc:'Remoção de partículas de ferro impregnadas - Argila e produtos específicos - Preparo ideal antes de polimento' },
  { id:'encera',   num:'12', nome:'Enceramento',                tempo:'40min',     base:{hatch:80,  sedan:96,  suv:104}, desc:'Aplicação de cera carnaúba ou sintética - Proteção e brilho duradouros - Repele água e sujeira' },
  { id:'macan',    num:'13', nome:'Polimento de Maçaneta',      tempo:'1h20',      base:{hatch:50,  sedan:50,  suv:50 }, desc:'Polimento específico das maçanetas - Remove riscos e oxidação' },
  { id:'pext',     num:'14', nome:'Revit. Plásticos Externos',  tempo:'40min',     base:{hatch:35,  sedan:42,  suv:45 }, desc:'Revitalizador nos plásticos externos - Para-choques, frisos e soleiras - Proteção contra UV' },
  { id:'pint',     num:'15', nome:'Revit. Plásticos Internos',  tempo:'1h',        base:{hatch:35,  sedan:42,  suv:45 }, desc:'Revitalização dos plásticos internos - Painel e acabamentos - Proteção UV' },
  { id:'polim',    num:'16', nome:'Polimento Profissional',     tempo:'6h – 8h',   base:{hatch:400, sedan:480, suv:530}, desc:'Descontaminação incluída - Fita de pintura em toda borracharia - Polimento de corte e refino - Remove micro-riscos' },
]

export const CATEGORIAS = [
  { nome: 'Lavagens',               ids: ['start','perf','resgate'] },
  { nome: 'Interior & Higienização', ids: ['interior','higien','teto','couro'] },
  { nome: 'Serviços Especiais',      ids: ['cfarol','rfarol','motor','descon'] },
  { nome: 'Acabamentos',             ids: ['encera','macan','pext','pint'] },
  { nome: 'Polimento',               ids: ['polim'] },
]

export const COMBOS = [
  { id:'c1', nome:'Combo Limpeza Total',     svcs:['start','interior'],              tag:'ESSENCIAL', desc:'Lavagem Start + Limpeza Interior' },
  { id:'c2', nome:'Combo Proteção',          svcs:['perf','encera','pext'],          tag:'PROTEÇÃO',  desc:'Lavagem Performance + Enceramento + Plásticos Ext.' },
  { id:'c3', nome:'Kit Faróis',              svcs:['cfarol','rfarol'],               tag:'FARÓIS',    desc:'Clareamento + Revitalização de Faróis' },
  { id:'c4', nome:'Interior Total',          svcs:['interior','higien'],             tag:'PREMIUM',   desc:'Limpeza Interior + Higienização com Extratora' },
  { id:'c5', nome:'Kit Refresh',             svcs:['higien','teto','couro'],         tag:'REFRESH',   desc:'Higienização + Teto + Couro' },
  { id:'c6', nome:'Combo Full',              svcs:['perf','descon','encera','pext','pint'], tag:'FULL', desc:'Performance + Descontaminação + Enceramento + Plásticos' },
]

export const TEMPO_SERVICO: Record<string, number> = {
  start:90, perf:150, resgate:300, interior:120, higien:240,
  cfarol:45, rfarol:180, motor:60, descon:60,
  encera:40, macan:80, pext:40, pint:60, teto:45, polim:480, couro:120,
}
