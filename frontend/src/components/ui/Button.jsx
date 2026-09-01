import PropTypes from 'prop-types'

const Button = ({ children, variant = 'primary', type = 'button', disabled = false, onClick, className = '', ...props }) => {
  const variants = {
    primary: 'button-primary',
    secondary: 'button-secondary',
    danger: 'button-danger',
    ghost: 'button-ghost',
  }

  return (
    <button
      type={type}
      className={`btn ${variants[variant]} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Button
