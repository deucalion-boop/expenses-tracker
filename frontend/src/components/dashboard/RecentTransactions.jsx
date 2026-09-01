import PropTypes from 'prop-types'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/currency'

const RecentTransactions = ({ transactions = [] }) => (
  <div className="list-block">
    {transactions.length === 0 ? (
      <p className="muted">No recent transactions.</p>
    ) : (
      transactions.map((transaction) => (
        <div key={`${transaction.type}-${transaction.id}`} className="transaction-item">
          <div className="transaction-icon">
            {transaction.type === 'income' ? <ArrowUpCircle size={18} className="up" /> : <ArrowDownCircle size={18} className="down" />}
          </div>
          <div className="transaction-info">
            <strong>{transaction.title}</strong>
            <small>{transaction.category}</small>
          </div>
          <div className="transaction-date">{formatDate(transaction.date)}</div>
          <div className={`transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}`}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>
        </div>
      ))
    )}
  </div>
)

RecentTransactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.oneOf(['income', 'expense']).isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    amount: PropTypes.number.isRequired,
  })),
}

export default RecentTransactions
