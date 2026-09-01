import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { fetchDashboard, fetchAnalytics } from '../services/analyticsService'
import SummaryCard from '../components/dashboard/SummaryCard'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatCurrency, formatMonthLabel } from '../utils/currency'

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, analyticsRes] = await Promise.all([fetchDashboard(), fetchAnalytics()])
        setDashboardData(dashboardRes)
        setAnalyticsData(analyticsRes)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const chartData = useMemo(() => {
    if (!analyticsData) return []
    const incomeTrend = analyticsData.incomeTrend || {}
    const expenseTrend = analyticsData.expenseTrend || {}
    const months = Array.from(new Set([...Object.keys(incomeTrend), ...Object.keys(expenseTrend)])).sort()

    return months.map((month) => ({
      month: formatMonthLabel(month),
      income: Number(incomeTrend[month] || 0),
      expense: Number(expenseTrend[month] || 0),
    }))
  }, [analyticsData])

  const pieData = useMemo(() => {
    if (!analyticsData?.categoryBreakdown) return []
    return Object.entries(analyticsData.categoryBreakdown).map(([name, value]) => ({ name, value }))
  }, [analyticsData])

  const spendingTrend = useMemo(() => {
    if (!analyticsData?.spendingTrend) return []
    return Object.entries(analyticsData.spendingTrend).map(([month, value]) => ({
      month: formatMonthLabel(month),
      value,
    }))
  }, [analyticsData])

  if (loading) {
    return <div className="centered"><LoadingSpinner size={32} /></div>
  }

  const totalIncome = Number(dashboardData?.totalIncome || 0)
  const totalExpenses = Number(dashboardData?.totalExpenses || 0)
  const balance = Number(dashboardData?.balance || 0)
  const savings = Number(dashboardData?.savings || 0)

  return (
    <div className="page-stack">
      <div className="stats-grid">
        <SummaryCard title="Total Balance" value={balance} accent="primary" />
        <SummaryCard title="Total Income" value={totalIncome} accent="success" />
        <SummaryCard title="Total Expenses" value={totalExpenses} accent="warning" />
        <SummaryCard title="Savings" value={savings} accent="secondary" />
      </div>

      <div className="chart-grid">
        <Card title="Expense breakdown" subtitle="By category" className="chart-card">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Income vs Expense" subtitle="Over time" className="chart-card">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
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

      <Card title="Spending trend" subtitle="Monthly pattern" className="chart-card full-width">
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₱${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent transactions" subtitle="Latest activity" className="full-width">
        <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
      </Card>
    </div>
  )
}

export default DashboardPage
