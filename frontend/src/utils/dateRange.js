export const boundsFor = (preset) => {
  const today = new Date()
  if (preset === 'all') return { startDate: '', endDate: '' }
  const start = new Date(today)
  if (preset === 'month') start.setDate(1)
  if (preset === 'year') { start.setMonth(0); start.setDate(1) }
  const localDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  return { startDate: localDate(start), endDate: localDate(today) }
}
