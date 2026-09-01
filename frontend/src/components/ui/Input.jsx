import PropTypes from 'prop-types'

const Input = ({ label, id, error, className = '', ...props }) => (
  <div className="field-group">
    {label && <label htmlFor={id}>{label}</label>}
    <input id={id} className={`input ${error ? 'invalid' : ''} ${className}`.trim()} {...props} />
    {error && <span className="field-error">{error}</span>}
  </div>
)

Input.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
}

export default Input
