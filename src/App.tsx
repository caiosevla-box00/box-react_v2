import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { useFirebase } from '@/hooks/useFirebase'
import { TokenGate } from '@/components/ui/TokenGate'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/ui/BottomNav'
import { Toast, Loading } from '@/components/ui/Feedback'
import { NovoOrcamento } from '@/components/modals/NovoOrcamento'
import { Home } from '@/components/tabs/Home'
import { Agenda } from '@/components/tabs/Agenda'
import { Clientes } from '@/components/tabs/Clientes'
import { Config } from '@/components/tabs/Config'
import { Custos } from '@/components/tabs/Custos'
import { Financeiro } from '@/components/tabs/Financeiro'
import { Combos } from '@/components/tabs/Combos'
import { Diluidor } from '@/components/tabs/Diluidor'

function AppContent() {
  const { activeTab, loading, setTab } = useStore()
  const [orcamentoOpen, setOrcamentoOpen] = useState(false)

  useFirebase()

  const renderTab = () => {
    switch (activeTab) {
      case 'home':       return <Home />
      case 'agenda':     return <Agenda />
      case 'clientes':   return <Clientes />
      case 'config':     return <Config />
      case 'custos':     return <Custos />
      case 'financeiro': return <Financeiro />
      case 'combos':     return <Combos onSelecionarCombo={(ids) => { setOrcamentoOpen(true) }} />
      case 'diluidor':   return <Diluidor />
      default:           return <Home />
    }
  }

  if (loading) return <Loading />

  return (
    <div style={{ maxWidth:'500px', margin:'0 auto', minHeight:'100vh', background:'var(--bg)' }}>
      <Toast />
      <Header />
      <main style={{ paddingTop:'calc(var(--head-h) + 8px)', paddingBottom:'calc(var(--nav-h) + 16px)', paddingLeft:'16px', paddingRight:'16px' }}>
        <div className="fade-up" key={activeTab}>
          {renderTab()}
        </div>
      </main>
      <BottomNav onNovoOrcamento={() => setOrcamentoOpen(true)} />
      {orcamentoOpen && <NovoOrcamento onFechar={() => setOrcamentoOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <TokenGate>
      <AppContent />
    </TokenGate>
  )
}
