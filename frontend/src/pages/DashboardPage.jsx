import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, PiggyBank, Plus, TrendingDown, TrendingUp, WalletCards } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchDashboard, fetchAnalytics } from '../services/analyticsService'
import SummaryCard from '../components/dashboard/SummaryCard'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import useAuthStore from '../store/authStore'
import { formatCurrency, formatMonthLabel } from '../utils/currency'

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const [dashboardData, setDashboardData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [dashboardRes, analyticsRes] = await Promise.all([fetchDashboard(), fetchAnalytics()])
        if (active) {
          setDashboardData(dashboardRes)
          setAnalyticsData(analyticsRes)
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [reloadKey])

  const chartData = useMemo(() => {
    if (!analyticsData) return []
    const incomeTrend = analyticsData.incomeTrend || {}
    const expenseTrend = analyticsData.expenseTrend || {}
    return Array.from(new Set([...Object.keys(incomeTrend), ...Object.keys(expenseTrend)]))
      .sort()
      .slice(-6)
      .map((month) => ({
        month: formatMonthLabel(month),
        income: Number(incomeTrend[month] || 0),
        expense: Number(expenseTrend[month] || 0),
      }))
  }, [analyticsData])

  const pieData = useMemo(() => {
    if (!analyticsData?.categoryBreakdown) return []
    return Object.entries(analyticsData.categoryBreakdown)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
  }, [analyticsData])

  const totalIncome = Number(dashboardData?.totalIncome || 0)
  const totalExpenses = Number(dashboardData?.totalExpenses || 0)
  const balance = Number(dashboardData?.balance || 0)
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  if (loading) return <div className="centered"><LoadingSpinner size={32} /></div>

  if (error) {
    return (
      <div className="dashboard-error card">
        <strong>We couldn’t load your dashboard</strong>
        <p>{error}</p>
        <Button onClick={() => setReloadKey((value) => value + 1)}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="page-stack dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span className="section-kicker">Financial overview</span>
          <h2>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h2>
          <p>Here’s a clear look at where your money stands today.</p>
        </div>
        <div className="quick-actions">
          <Link to="/income" className="quick-action secondary"><ArrowUpRight size={17} /> Add income</Link>
          <Link to="/expenses" className="quick-action primary"><Plus size={17} /> Add expense</Link>
        </div>
      </section>

      <div className="stats-grid dashboard-stats">
        <SummaryCard title="Available balance" value={balance} accent="primary" icon={WalletCards} detail="Income minus expenses" />
        <SummaryCard title="Total income" value={totalIncome} accent="success" icon={TrendingUp} detail="All recorded income" />
        <SummaryCard title="Total expenses" value={totalExpenses} accent="warning" icon={TrendingDown} detail="All recorded spending" />
        <SummaryCard title="Net savings" value={balance} accent="secondary" icon={PiggyBank} detail={`${savingsRate}% of total income`} />
      </div>

      <div className="dashboard-chart-grid">
        <Card title="Cash flow" subtitle="Income and expenses over the last 6 active months" className="chart-card cash-flow-card">
          {chartData.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={chartData} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(value) => `₱${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'var(--primary-soft)' }} />
                  <Bar name="Income" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  <Bar name="Expense" dataKey="expense" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="chart-empty">Add income or expenses to see your cash-flow chart.</div>}
        </Card>

        <Card title="Spending by category" subtitle="Where your money goes" className="chart-card category-card">
          {pieData.length ? (
            <>
              <div className="chart-wrap compact">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">
                      {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="category-legend">
                {pieData.slice(0, 5).map((item, index) => (
                  <div key={item.name}><span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{formatCurrency(item.value)}</strong></div>
                ))}
              </div>
            </>
          ) : <div className="chart-empty">Your expense categories will appear here.</div>}
        </Card>
      </div>

      <div className="dashboard-lower-grid">
        <Card title="Balance trend" subtitle="Your monthly net position" className="chart-card">
          {chartData.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.map((item) => ({ ...item, balance: item.income - item.expense }))}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(value) => `₱${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="balance" name="Net balance" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="chart-empty">Monthly balance history will appear here.</div>}
        </Card>

        <Card title="Recent activity" subtitle="Your latest transactions" className="recent-card">
          <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
          {(dashboardData?.recentTransactions || []).length > 0 && (
            <div className="activity-summary">
              <span><ArrowUpRight size={14} /> Income</span>
              <span><ArrowDownRight size={14} /> Expense</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
