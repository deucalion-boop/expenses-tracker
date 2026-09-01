import PropTypes from 'prop-types'

const Select = ({ label, id, error, options = [], className = '', ...props }) => (
  <div className="field-group">
    {label && <label htmlFor={id}>{label}</label>}
    <select id={id} className={`input ${error ? 'invalid' : ''} ${className}`.trim()} {...props}>
      {options.map((option) => (
        <option key={option.value ?? option} value={option.value ?? option}>
          {option.label ?? option}
        </option>
      ))}
    </select>
    {error && <span className="field-error">{error}</span>}
  </div>
)

Select.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  error: PropTypes.string,
  options: PropTypes.array,
  className: PropTypes.string,
}

export default Select
