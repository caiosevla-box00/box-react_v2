import { useEffect } from 'react'
import { db, COLS, collection, query, orderBy, onSnapshot, tsToStr } from '@/lib/firebase'
import { useStore } from '@/store'
import type { Cliente, Agendamento, Atendimento, Saida, Config } from '@/types'

export function useFirebase() {
  const { setClientes, setAgendamentos, setAtendimentos, setSaidas, applyConfig, setOnline, setLoading } = useStore()

  useEffect(() => {
    let loaded = 0
    const total = 5
    const checkDone = () => { loaded++; if (loaded >= total) setLoading(false) }

    // Clientes
    const unClientes = onSnapshot(
      query(collection(db, COLS.clientes), orderBy('criadoEm', 'desc')),
      snap => {
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente)))
        setOnline(true)
        checkDone()
      },
      () => checkDone()
    )

    // Agendamentos
    const unAgs = onSnapshot(
      query(collection(db, COLS.agendamentos), orderBy('data', 'desc')),
      snap => {
        setAgendamentos(snap.docs.map(d => {
          const data = d.data()
          return { id: d.id, ...data, data: tsToStr(data.data) || data.data } as Agendamento
        }))
        checkDone()
      },
      () => checkDone()
    )

    // Atendimentos
    const unAts = onSnapshot(
      query(collection(db, COLS.atendimentos), orderBy('data', 'desc')),
      snap => {
        setAtendimentos(snap.docs.map(d => {
          const data = d.data()
          return { id: d.id, ...data, data: tsToStr(data.data) || data.data } as Atendimento
        }))
        checkDone()
      },
      () => checkDone()
    )

    // Saídas
    const unSaidas = onSnapshot(
      query(collection(db, COLS.saidas), orderBy('data', 'desc')),
      snap => {
        setSaidas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saida)))
        checkDone()
      },
      () => checkDone()
    )

    // Config
    const unConfig = onSnapshot(
      collection(db, COLS.config),
      snap => {
        const cfg: Config = {}
        snap.docs.forEach(d => { Object.assign(cfg, d.data()) })
        applyConfig(cfg)
        checkDone()
      },
      () => checkDone()
    )

    // Detecta online/offline
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      unClientes(); unAgs(); unAts(); unSaidas(); unConfig()
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
}
