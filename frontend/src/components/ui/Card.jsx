import PropTypes from 'prop-types'

const Card = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`card ${className}`.trim()}>
    {(title || subtitle || action) && (
      <div className="card-header">
        <div>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
)

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
}

export default Card
