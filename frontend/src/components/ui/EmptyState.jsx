import PropTypes from 'prop-types'
import Button from './Button'

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    <p>{description}</p>
    {actionLabel && (
      <Button onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
)

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
}

export default EmptyState
