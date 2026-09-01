import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createIncome, deleteIncome, fetchIncome, updateIncome } from '../services/incomeService'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { formatCurrency, formatDate } from '../utils/currency'

const sources = ['Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other']
const defaultForm = {
  title: '',
  amount: '',
  source: sources[0],
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

const IncomePage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('desc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadIncome = async () => {
    setLoading(true)
    try {
      const response = await fetchIncome({ search, sort })
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
        const response = await fetchIncome({ search, sort })
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
  }, [search, sort])

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
      source: item.source,
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
        source: form.source,
        date: form.date,
        description: form.description.trim(),
      }

      if (editingId) {
        await updateIncome(editingId, payload)
        toast.success('Income updated successfully')
      } else {
        await createIncome(payload)
        toast.success('Income added successfully')
      }

      closeModal()
      loadIncome()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteIncome(id)
      toast.success('Income deleted successfully')
      loadIncome()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <div className="toolbar-row">
          <div className="toolbar-filters">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search income" aria-label="Search income" />
            <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort income">
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>
          <Button onClick={openCreateModal} className="with-icon">
            <Plus size={16} /> Add Income
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="centered"><LoadingSpinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No income recorded" description="Add your first income transaction to start tracking your finances." actionLabel="Add Income" onAction={openCreateModal} />
      ) : (
        <Card className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Title">
                      <div className="table-title">
                        <strong>{item.title}</strong>
                        <small>{item.description || 'No description'}</small>
                      </div>
                    </td>
                    <td data-label="Source">{item.source}</td>
                    <td data-label="Date">{formatDate(item.date)}</td>
                    <td data-label="Amount" className="amount positive">+{formatCurrency(item.amount)}</td>
                    <td data-label="Actions">
                      <div className="row-actions">
                        <button type="button" className="icon-button small" onClick={() => openEditModal(item)} aria-label="Edit income">
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-button small danger" onClick={() => handleDelete(item._id)} aria-label="Delete income">
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit income' : 'Add income'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid two-cols">
            <Input label="Title" id="income-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <Input label="Amount" id="income-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
            <Select label="Source" id="income-source" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} options={sources.map((source) => ({ value: source, label: source }))} />
            <Input label="Date" id="income-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          </div>
          <Input label="Description" id="income-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          {formError && <p className="field-error block">{formError}</p>}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default IncomePage
