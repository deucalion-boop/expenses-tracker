export const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatMonthLabel = (value) => {
  if (!value) return '—'
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    year: 'numeric',
  })
}
