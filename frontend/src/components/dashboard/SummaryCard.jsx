import PropTypes from 'prop-types'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/currency'

const SummaryCard = ({ title, value, accent = 'primary' }) => (
  <Card className="stat-card">
    <div className={`stat-accent ${accent}`} />
    <div className="stat-content">
      <span>{title}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  </Card>
)

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  accent: PropTypes.oneOf(['primary', 'success', 'warning', 'secondary']),
}

export default SummaryCard
