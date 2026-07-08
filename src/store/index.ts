import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabId, TipoV, Cliente, Agendamento, Atendimento, Saida, Config, ServicoCustom } from '@/types'
import { SERVICOS } from '@/lib/servicos'

type Precos = Record<string, { hatch: number; sedan: number; suv: number }>

function initPrecos(): Precos {
  const p: Precos = {}
  SERVICOS.forEach(s => { p[s.id] = { ...s.base } })
  return p
}

interface AppState {
  // UI
  activeTab: TabId
  toast: string | null
  loading: boolean
  online: boolean
  agendaDay: string | null  // data selecionada na agenda (null = hoje)

  // Data (cache local — Firebase é a fonte real via listeners)
  clientes: Cliente[]
  agendamentos: Agendamento[]
  atendimentos: Atendimento[]
  saidas: Saida[]

  // Config
  precos: Precos
  divisao: { contas: number; maquinas: number; estoque: number; lucro: number }
  meta: number
  taxaDebito: number
  custoPorKm: number
  servicosCustom: ServicoCustom[]

  // Orcamento state
  veiculo: TipoV

  // Actions
  setTab: (t: TabId) => void
  setAgendaDay: (d: string | null) => void
  toast_show: (msg: string) => void
  toast_clear: () => void
  setLoading: (v: boolean) => void
  setOnline: (v: boolean) => void
  setVeiculo: (v: TipoV) => void
  setClientes: (c: Cliente[]) => void
  setAgendamentos: (a: Agendamento[]) => void
  setAtendimentos: (a: Atendimento[]) => void
  setSaidas: (s: Saida[]) => void
  setPrecos: (p: Precos) => void
  setDivisao: (d: AppState['divisao']) => void
  setMeta: (m: number) => void
  setCustoPorKm: (v: number) => void
  setServicosCustom: (s: ServicoCustom[]) => void
  applyConfig: (c: Config) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'home',
      toast: null,
      loading: true,
      online: false,
      agendaDay: null,
      clientes: [],
      agendamentos: [],
      atendimentos: [],
      saidas: [],
      precos: initPrecos(),
      divisao: { contas: 10, maquinas: 10, estoque: 20, lucro: 60 },
      meta: 0,
      taxaDebito: 1.5,
      custoPorKm: 0,
      servicosCustom: [],
      veiculo: 'hatch',

      setTab: (t) => set({ activeTab: t }),
      setAgendaDay: (d) => set({ agendaDay: d }),
      toast_show: (msg) => set({ toast: msg }),
      toast_clear: () => set({ toast: null }),
      setLoading: (v) => set({ loading: v }),
      setOnline: (v) => set({ online: v }),
      setVeiculo: (v) => set({ veiculo: v }),
      setClientes: (c) => set({ clientes: c }),
      setAgendamentos: (a) => set({ agendamentos: a }),
      setAtendimentos: (a) => set({ atendimentos: a }),
      setSaidas: (s) => set({ saidas: s }),
      setPrecos: (p) => set({ precos: p }),
      setDivisao: (d) => set({ divisao: d }),
      setMeta: (m) => set({ meta: m }),
      setCustoPorKm: (v) => set({ custoPorKm: v }),
      setServicosCustom: (s) => set({ servicosCustom: s }),
      applyConfig: (c) => set(state => ({
        precos: c.precos ?? state.precos,
        divisao: c.divisao ?? state.divisao,
        meta: c.meta ?? state.meta,
        taxaDebito: c.taxaDebito ?? state.taxaDebito,
        custoPorKm: c.custoPorKm ?? state.custoPorKm,
        servicosCustom: c.servicosCustom ?? state.servicosCustom,
      })),
    }),
    {
      name: 'box00-v2',
      partialize: (s) => ({
        clientes: s.clientes,
        agendamentos: s.agendamentos,
        atendimentos: s.atendimentos,
        saidas: s.saidas,
        precos: s.precos,
        divisao: s.divisao,
        meta: s.meta,
        taxaDebito: s.taxaDebito,
        custoPorKm: s.custoPorKm,
        servicosCustom: s.servicosCustom,
        veiculo: s.veiculo,
      }),
    }
  )
)
