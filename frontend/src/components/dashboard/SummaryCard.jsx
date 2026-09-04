import PropTypes from 'prop-types'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/currency'

const SummaryCard = ({ title, value, accent = 'primary', icon: Icon, detail }) => (
  <Card className={`stat-card ${accent}`}>
    {Icon && <div className={`stat-icon ${accent}`}><Icon size={20} /></div>}
    <div className="stat-content">
      <span>{title}</span>
      <strong>{formatCurrency(value)}</strong>
      {detail && <small>{detail}</small>}
    </div>
  </Card>
)

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  accent: PropTypes.oneOf(['primary', 'success', 'warning', 'secondary']),
  icon: PropTypes.elementType,
  detail: PropTypes.string,
}

export default SummaryCard
