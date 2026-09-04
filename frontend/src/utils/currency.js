const getPreferences = () => {
  try { return JSON.parse(localStorage.getItem('spendwise-display-preferences') || localStorage.getItem('ledgerflow-display-preferences') || '{}') } catch { return {} }
}

export const storeDisplayPreferences = (user) => localStorage.setItem('spendwise-display-preferences', JSON.stringify({
  currency: user.currency || 'PHP', dateFormat: user.dateFormat || 'MMM d, yyyy',
}))

export const formatCurrency = (value) => {
  const amount = Number(value) || 0
  const currency = getPreferences().currency || 'PHP'
  return new Intl.NumberFormat(currency === 'PHP' ? 'en-PH' : 'en-US', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  const format = getPreferences().dateFormat || 'MMM d, yyyy'
  if (format === 'yyyy-MM-dd') return date.toLocaleDateString('en-CA')
  if (format === 'MM/dd/yyyy') return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  if (format === 'dd/MM/yyyy') return date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatMonthLabel = (value) => {
  if (!value) return '—'
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
}
