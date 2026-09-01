import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchAnalytics } from '../services/analyticsService'
import { formatCurrency, formatMonthLabel } from '../utils/currency'

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316', '#0ea5e9']

const AnalyticsPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchAnalytics()
        setData(response)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const categoryBreakdown = useMemo(() => {
    if (!data?.categoryBreakdown) return []
    return Object.entries(data.categoryBreakdown).map(([name, value]) => ({ name, value }))
  }, [data])

  const incomeExpenseTrend = useMemo(() => {
    if (!data) return []
    const months = Array.from(new Set([...Object.keys(data.incomeTrend || {}), ...Object.keys(data.expenseTrend || {})])).sort()
    return months.map((month) => ({
      month: formatMonthLabel(month),
      income: Number(data.incomeTrend?.[month] || 0),
      expense: Number(data.expenseTrend?.[month] || 0),
    }))
  }, [data])

  if (loading) {
    return <div className="centered"><LoadingSpinner size={28} /></div>
  }

  return (
    <div className="page-stack">
      <div className="stats-grid analytics-grid">
        <Card className="mini-stat"><span>Total income</span><strong>{formatCurrency(data?.totalIncome || 0)}</strong></Card>
        <Card className="mini-stat"><span>Total expenses</span><strong>{formatCurrency(data?.totalExpenses || 0)}</strong></Card>
        <Card className="mini-stat"><span>Net savings</span><strong>{formatCurrency(data?.netSavings || 0)}</strong></Card>
        <Card className="mini-stat"><span>Average monthly spending</span><strong>{formatCurrency(data?.averageMonthlySpending || 0)}</strong></Card>
        <Card className="mini-stat"><span>Highest category</span><strong>{data?.highestSpendingCategory || 'None'}</strong></Card>
      </div>

      <div className="chart-grid">
        <Card title="Category breakdown" className="chart-card">
          <div className="chart-wrap small">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {categoryBreakdown.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Income vs expenses" className="chart-card">
          <div className="chart-wrap small">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomeExpenseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₱${value / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Spending trends" className="chart-card full-width">
        <div className="chart-wrap small">
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={incomeExpenseTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₱${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} />
              <Line type="monotone" dataKey="income" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default AnalyticsPage
