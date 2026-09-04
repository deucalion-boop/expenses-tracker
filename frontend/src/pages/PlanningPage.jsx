import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarClock, Download, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { deleteBudget, deleteRecurring, downloadTransactions, fetchBudgets, fetchRecurring, saveBudget, saveRecurring } from '../services/financeService'
import { formatCurrency, formatDate } from '../utils/currency'

const categories = ['Food','Transportation','Shopping','Bills','Entertainment','Health','Education','Travel','Other']
const sources = ['Salary','Freelance','Business','Allowance','Investment','Gift','Other']
const methods = ['Cash','Credit Card','Debit Card','Bank Transfer','E-Wallet','Other']
const currentMonth = new Date().toISOString().slice(0, 7)
const budgetDefault = { category: 'Food', amount: '' }
const recurringDefault = { type: 'expense', title: '', amount: '', category: 'Bills', source: 'Salary', paymentMethod: 'Bank Transfer', frequency: 'monthly', nextRunDate: new Date().toISOString().slice(0,10), description: '', active: true }

const PlanningPage = () => {
  const [month, setMonth] = useState(currentMonth)
  const [budgets, setBudgets] = useState([])
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [budgetForm, setBudgetForm] = useState(budgetDefault)
  const [recurringForm, setRecurringForm] = useState(recurringDefault)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [recurringOpen, setRecurringOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [budgetData, recurringData] = await Promise.all([fetchBudgets(month), fetchRecurring()])
      setBudgets(budgetData || []); setRecurring(recurringData || [])
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const [budgetData, recurringData] = await Promise.all([fetchBudgets(month), fetchRecurring()])
        if (active) { setBudgets(budgetData || []); setRecurring(recurringData || []); setLoading(false) }
      } catch (error) { if (active) { toast.error(error.message); setLoading(false) } }
    }
    run()
    return () => { active = false }
  }, [month])

  const submitBudget = async (event) => {
    event.preventDefault()
    try { await saveBudget({ ...budgetForm, amount: Number(budgetForm.amount), month }); setBudgetOpen(false); setBudgetForm(budgetDefault); await load(); toast.success('Monthly budget saved') } catch (error) { toast.error(error.message) }
  }
  const submitRecurring = async (event) => {
    event.preventDefault()
    try { await saveRecurring({ ...recurringForm, amount: Number(recurringForm.amount) }); setRecurringOpen(false); setRecurringForm(recurringDefault); await load(); toast.success('Recurring transaction saved') } catch (error) { toast.error(error.message) }
  }

  if (loading) return <div className="centered"><LoadingSpinner size={30} /></div>
  return <div className="page-stack planning-page">
    <section className="dashboard-welcome"><div><span className="section-kicker">Financial planning</span><h2>Plan before you spend</h2><p>Control monthly limits and automate regular transactions.</p></div><Button variant="secondary" className="with-icon" onClick={() => downloadTransactions()}><Download size={16}/> Export CSV</Button></section>

    <Card title="Monthly budgets" subtitle="Track category limits and remaining amounts" action={<Input aria-label="Budget month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}>
      <div className="planning-toolbar"><Button onClick={() => setBudgetOpen(true)} className="with-icon"><Plus size={16}/> Set category budget</Button></div>
      <div className="budget-grid">{budgets.map((budget) => <div className={`budget-item ${budget.overspent ? 'over' : ''}`} key={budget._id}>
        <div className="budget-heading"><div><strong>{budget.category}</strong><small>{formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}</small></div><button className="icon-button small danger" aria-label={`Delete ${budget.category} budget`} onClick={async () => { await deleteBudget(budget._id); load() }}><Trash2 size={15}/></button></div>
        <div className="budget-progress"><span style={{ width: `${budget.percentage}%` }}/></div>
        <div className="budget-foot"><span>{budget.overspent ? <><AlertTriangle size={14}/> Over by {formatCurrency(Math.abs(budget.remaining))}</> : `${formatCurrency(budget.remaining)} remaining`}</span><strong>{budget.percentage}%</strong></div>
      </div>)}</div>
      {!budgets.length && <p className="admin-empty">No budgets set for this month.</p>}
    </Card>

    <Card title="Recurring transactions" subtitle="Due items are recorded automatically when you open the app" action={<Button onClick={() => setRecurringOpen(true)} className="with-icon"><Plus size={16}/> Add schedule</Button>}>
      <div className="recurring-list">{recurring.map((item) => <div className="recurring-item" key={item._id}><span className={`transaction-icon ${item.type}`}><CalendarClock size={17}/></span><div><strong>{item.title}</strong><small>{item.frequency} · next {formatDate(item.nextRunDate)}</small></div><strong className={item.type === 'income' ? 'up' : 'down'}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</strong><button className="icon-button small danger" aria-label={`Delete ${item.title}`} onClick={async () => { await deleteRecurring(item._id); load() }}><Trash2 size={15}/></button></div>)}</div>
      {!recurring.length && <p className="admin-empty">No recurring transactions configured.</p>}
    </Card>

    <Card title="Monthly report" subtitle="Print or save the current dashboard as PDF"><Button variant="secondary" onClick={() => window.print()}>Print financial report</Button></Card>

    <Modal isOpen={budgetOpen} onClose={() => setBudgetOpen(false)} title="Set monthly budget"><form className="modal-form" onSubmit={submitBudget}><Select label="Category" value={budgetForm.category} onChange={(e) => setBudgetForm({...budgetForm,category:e.target.value})} options={categories.map(value => ({value,label:value}))}/><Input label="Monthly limit" type="number" min="0.01" step="0.01" required value={budgetForm.amount} onChange={(e) => setBudgetForm({...budgetForm,amount:e.target.value})}/><div className="modal-actions"><Button variant="secondary" onClick={() => setBudgetOpen(false)}>Cancel</Button><Button type="submit">Save budget</Button></div></form></Modal>
    <Modal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} title="Add recurring transaction"><form className="modal-form" onSubmit={submitRecurring}><div className="form-grid two-cols"><Select label="Type" value={recurringForm.type} onChange={(e) => setRecurringForm({...recurringForm,type:e.target.value})} options={[{value:'expense',label:'Expense'},{value:'income',label:'Income'}]}/><Input label="Title" required value={recurringForm.title} onChange={(e) => setRecurringForm({...recurringForm,title:e.target.value})}/><Input label="Amount" type="number" min="0.01" step="0.01" required value={recurringForm.amount} onChange={(e) => setRecurringForm({...recurringForm,amount:e.target.value})}/>{recurringForm.type === 'expense' ? <><Select label="Category" value={recurringForm.category} onChange={(e) => setRecurringForm({...recurringForm,category:e.target.value})} options={categories.map(value => ({value,label:value}))}/><Select label="Payment" value={recurringForm.paymentMethod} onChange={(e) => setRecurringForm({...recurringForm,paymentMethod:e.target.value})} options={methods.map(value => ({value,label:value}))}/></> : <Select label="Source" value={recurringForm.source} onChange={(e) => setRecurringForm({...recurringForm,source:e.target.value})} options={sources.map(value => ({value,label:value}))}/>}<Select label="Frequency" value={recurringForm.frequency} onChange={(e) => setRecurringForm({...recurringForm,frequency:e.target.value})} options={['daily','weekly','monthly','yearly'].map(value => ({value,label:value[0].toUpperCase()+value.slice(1)}))}/><Input label="First date" type="date" required value={recurringForm.nextRunDate} onChange={(e) => setRecurringForm({...recurringForm,nextRunDate:e.target.value})}/></div><Input label="Description" value={recurringForm.description} onChange={(e) => setRecurringForm({...recurringForm,description:e.target.value})}/><div className="modal-actions"><Button variant="secondary" onClick={() => setRecurringOpen(false)}>Cancel</Button><Button type="submit">Save schedule</Button></div></form></Modal>
  </div>
}
export default PlanningPage
