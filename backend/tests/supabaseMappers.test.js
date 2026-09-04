import test from 'node:test'
import assert from 'node:assert/strict'
import { mapExpense, mapIncome, mapProfile, toDateOnly } from '../src/utils/supabaseMappers.js'

test('maps Supabase profile fields to the API contract', () => {
  const profile = mapProfile({ id: '1', name: 'Test User', email: 'test@example.com', role: 'user', status: 'active', currency: 'USD', date_format: 'MM/dd/yyyy', theme: 'dark', dashboard_period: 'year' })
  assert.equal(profile._id, '1')
  assert.equal(profile.currency, 'USD')
  assert.equal(profile.theme, 'dark')
})

test('maps numeric transaction values and dates', () => {
  assert.equal(mapExpense({ id: 'e', amount: '12.50', transaction_date: '2026-09-05' }).amount, 12.5)
  assert.equal(mapIncome({ id: 'i', amount: '42.00', transaction_date: '2026-09-05' }).amount, 42)
  assert.equal(toDateOnly('2026-09-05T12:00:00Z'), '2026-09-05')
})
