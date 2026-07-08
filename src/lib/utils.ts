export function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatarDataBR(iso: string): string {
  if (!iso) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split('-')
    return `${d}/${m}/${a}`
  }
  const dt = new Date(iso)
  if (!isNaN(dt.getTime())) {
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
  }
  return iso
}

export function toISO(br: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(br)) return br
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(br)) {
    const [d, m, a] = br.split('/')
    return `${a}-${m}-${d}`
  }
  return br
}

export function gerarId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function primeiroNome(nome: string | undefined): string {
  return (nome || '').split(' ')[0]
}

export function diasDesde(dataISO: string): number | null {
  if (!dataISO) return null
  const iso = toISO(dataISO)
  const dt = new Date(iso + 'T12:00:00')
  if (isNaN(dt.getTime())) return null
  return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24))
}

export function nomeDiaSemana(iso: string): string {
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const dt = new Date(iso + 'T12:00:00')
  return isNaN(dt.getTime()) ? '' : dias[dt.getDay()]
}

export function slotParaMin(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return (h - 8) * 60 + m
}

export function minParaSlot(min: number): string {
  const total = 8 * 60 + min
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

export function getMesAtual(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
}

export function getSemanaLabel(iso: string): string {
  const dt = new Date(iso + 'T12:00:00')
  if (isNaN(dt.getTime())) return ''
  const d = dt.getDate()
  const m = dt.getMonth() + 1
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`
}
