import test from 'node:test'
import assert from 'node:assert/strict'
import { boundsFor } from '../src/utils/dateRange.js'
import { formatCurrency } from '../src/utils/currency.js'

test('all-time range has no date boundaries', () => {
  assert.deepEqual(boundsFor('all'), { startDate: '', endDate: '' })
})

test('monthly range begins on the first day', () => {
  assert.match(boundsFor('month').startDate, /^\d{4}-\d{2}-01$/)
})

test('currency formatter returns a monetary value', () => {
  assert.match(formatCurrency(1234.5), /1,234\.50/)
})
