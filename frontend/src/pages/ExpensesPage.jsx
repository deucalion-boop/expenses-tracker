import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { formatCurrency, formatDate } from '../utils/currency'
import useDebouncedValue from '../hooks/useDebouncedValue'

const categories = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other']
const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Other']

const defaultForm = {
  title: '',
  amount: '',
  category: categories[0],
  paymentMethod: paymentMethods[0],
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

const ExpensesPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('desc')
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const debouncedSearch = useDebouncedValue(search)

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetchExpenses({ search, category: categoryFilter, sort })
      setItems(response || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const run = async () => {
      setLoading(true)
      try {
        const response = await fetchExpenses({ search: debouncedSearch, category: categoryFilter, sort })
        if (active) {
          setItems(response || [])
        }
      } catch (error) {
        if (active) {
          toast.error(error.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      active = false
    }
  }, [debouncedSearch, categoryFilter, sort])

  const filteredItems = useMemo(() => items, [items])

  const openCreateModal = () => {
    setEditingId(null)
    setForm(defaultForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item._id)
    setForm({
      title: item.title,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(defaultForm)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setFormError('Title is required')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Amount must be greater than 0')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        paymentMethod: form.paymentMethod,
        date: form.date,
        description: form.description.trim(),
      }

      if (editingId) {
        await updateExpense(editingId, payload)
        toast.success('Expense updated successfully')
      } else {
        await createExpense(payload)
        toast.success('Expense added successfully')
      }

      closeModal()
      loadExpenses()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteExpense(pendingDelete._id)
      toast.success('Expense deleted successfully')
      setPendingDelete(null)
      loadExpenses()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <div className="toolbar-row">
          <div className="toolbar-filters">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" aria-label="Search expenses" />
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Category filter">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort expenses">
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>
          <Button onClick={openCreateModal} className="with-icon">
            <Plus size={16} /> Add Expense
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="centered"><LoadingSpinner size={28} /></div>
      ) : filteredItems.length === 0 ? (
        <EmptyState title="No expenses yet" description="Start tracking your spending by adding your first expense." actionLabel="Add Expense" onAction={openCreateModal} />
      ) : (
        <Card className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="table-title">
                        <strong>{item.title}</strong>
                        <small>{item.description || 'No description'}</small>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.paymentMethod}</td>
                    <td>{formatDate(item.date)}</td>
                    <td className="amount negative">-{formatCurrency(item.amount)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-button small" onClick={() => openEditModal(item)} aria-label="Edit expense">
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-button small danger" onClick={() => setPendingDelete(item)} aria-label="Delete expense">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit expense' : 'Add expense'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid two-cols">
            <Input label="Title" id="expense-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <Input label="Amount" id="expense-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
            <Select label="Category" id="expense-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} options={categories.map((category) => ({ value: category, label: category }))} />
            <Select label="Payment method" id="expense-payment" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} options={paymentMethods.map((method) => ({ value: method, label: method }))} />
            <Input label="Date" id="expense-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            <div />
          </div>
          <Input label="Description" id="expense-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          {formError && <p className="field-error block">{formError}</p>}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete expense?" message={`Delete ${pendingDelete?.title || 'this expense'}? This action cannot be undone.`} onCancel={() => setPendingDelete(null)} onConfirm={handleDelete} />
    </div>
  )
}

export default ExpensesPage
