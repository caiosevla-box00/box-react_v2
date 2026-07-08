export type TabId = 'home' | 'agenda' | 'orcamento' | 'clientes' | 'financeiro' | 'custos' | 'config' | 'diluidor' | 'combos'
export type TipoV = 'hatch' | 'sedan' | 'suv'
export type StatusAg = 'agendado' | 'concluido' | 'pago' | 'cancelado'

export interface Cliente {
  id: string
  nome: string
  tel?: string
  ig?: string
  email?: string
  origem?: string
  tipoVeiculo?: TipoV
  marca?: string
  modelo?: string
  ano?: string
  cor?: string
  criadoEm?: string
}

export interface Agendamento {
  id: string
  clienteId: string
  nomeCliente?: string
  data: string        // yyyy-mm-dd
  hora: string        // HH:MM
  duracao: number     // minutos
  servico: string
  svcIds?: string[]
  obs?: string
  status: StatusAg
  valorAcordado?: number
  obsEncerramento?: string
  criadoEm?: string
}

export interface Atendimento {
  id: string
  clienteId: string
  nomeCliente?: string
  data: string
  servicos: string
  valor: number
  formaPagamento?: string
  parcelas?: number
  taxaPct?: number
  valorCobrado?: number
  custoTaxa?: number
  valorLiquido?: number
  divContas?: number
  divMaquinas?: number
  divEstoque?: number
  divLucro?: number
  obs?: string
  criadoEm?: string
}

export interface Saida {
  id: string
  desc: string
  valor: number
  data: string
  criadoEm?: string
}

export interface Config {
  precos?: Record<string, { hatch: number; sedan: number; suv: number }>
  divisao?: { contas: number; maquinas: number; estoque: number; lucro: number }
  meta?: number
  taxaDebito?: number
  custoPorKm?: number
  servicosCustom?: ServicoCustom[]
}

export interface ServicoCustom {
  id: string
  nome: string
  tempo: string
  desc: string
  hatch: number
  sedan: number
  suv: number
  categoria: string
}
