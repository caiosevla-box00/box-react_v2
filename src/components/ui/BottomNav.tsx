import { useState } from 'react'
import { useStore } from '@/store'
import type { TabId } from '@/types'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home',     icon: '🏠', label: 'Home'    },
  { id: 'agenda',   icon: '📅', label: 'Agenda'  },
  { id: 'clientes', icon: '👥', label: 'Clientes'},
  { id: 'financeiro',icon:'💰', label: 'Financeiro'},
]

const MORE: { id: TabId; icon: string; label: string }[] = [
  { id: 'combos',    icon: '🎁', label: 'Combos'   },
  { id: 'custos',    icon: '📊', label: 'Custos'   },
  { id: 'config',    icon: '⚙️', label: 'Config'   },
  { id: 'diluidor',  icon: '🧪', label: 'Diluidor' },
]

interface Props {
  onNovoOrcamento: () => void
}

export function BottomNav({ onNovoOrcamento }: Props) {
  const { activeTab, setTab } = useStore()
  const [showMore, setShowMore] = useState(false)
  const isMore = MORE.some(t => t.id === activeTab)

  function goTab(id: TabId) { setTab(id); setShowMore(false) }

  return (
    <>
      {/* Sheet "Mais" */}
      {showMore && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div onClick={() => setShowMore(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)' }} />
          <div className="slide-up" style={{ position:'relative', zIndex:1, background:'var(--s2)', borderRadius:'20px 20px 0 0', padding:'8px 16px 40px', maxWidth:'500px', width:'100%', margin:'0 auto' }}>
            <div style={{ width:36, height:4, background:'var(--borda)', borderRadius:2, margin:'10px auto 16px' }} />
            <div style={{ fontSize:'11px', fontWeight:600, color:'var(--dim)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'12px' }}>Mais opções</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {MORE.map(t => (
                <button key={t.id} onClick={() => goTab(t.id)} style={{
                  display:'flex', alignItems:'center', gap:'12px', padding:'14px',
                  borderRadius:'var(--r)', cursor:'pointer',
                  background: activeTab === t.id ? 'var(--vbg)' : 'var(--s1)',
                  border: `1px solid ${activeTab === t.id ? 'var(--verde)' : 'var(--borda)'}`,
                  color: activeTab === t.id ? 'var(--verde)' : 'var(--txt)',
                  fontSize:'14px', fontWeight:600,
                }}>
                  <span style={{ fontSize:'20px' }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'var(--s2)', borderTop:'0.5px solid var(--borda)',
        maxWidth:'500px', margin:'0 auto',
        paddingBottom:'env(safe-area-inset-bottom,0px)',
        height:'var(--nav-h)',
      }}>
        <div style={{ display:'flex', alignItems:'stretch', height:'100%' }}>
          {/* Home + Agenda */}
          {TABS.slice(0, 2).map(t => (
            <TabBtn key={t.id} tab={t} active={activeTab === t.id} onClick={() => goTab(t.id)} />
          ))}

          {/* FAB central */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, paddingBottom:'8px' }}>
            <button onClick={onNovoOrcamento} style={{
              width:'54px', height:'54px', borderRadius:'50%', border:'none',
              background:'var(--verde)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'26px', boxShadow:'0 4px 16px rgba(170,255,0,.35)',
            }}>
              🧾
            </button>
          </div>

          {/* Clientes + Financeiro */}
          {TABS.slice(2, 4).map(t => (
            <TabBtn key={t.id} tab={t} active={activeTab === t.id} onClick={() => goTab(t.id)} />
          ))}

          {/* Mais */}
          <button onClick={() => setShowMore(!showMore)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:'3px', border:'none',
            background:'transparent', cursor:'pointer',
            borderTop: (isMore || showMore) ? '2px solid var(--verde)' : '2px solid transparent',
          }}>
            <span style={{ fontSize:'18px', lineHeight:1 }}>⋯</span>
            <span style={{ fontSize:'8px', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase', color:(isMore||showMore)?'var(--verde)':'var(--dim)' }}>Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}

function TabBtn({ tab, active, onClick }: { tab: {id:TabId;icon:string;label:string}; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:'3px', border:'none',
      background:'transparent', cursor:'pointer',
      borderTop: active ? '2px solid var(--verde)' : '2px solid transparent',
    }}>
      <span style={{ fontSize:'18px', lineHeight:1 }}>{tab.icon}</span>
      <span style={{ fontSize:'8px', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase', color: active ? 'var(--verde)' : 'var(--dim)' }}>{tab.label}</span>
    </button>
  )
}
