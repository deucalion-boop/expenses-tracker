const LoadingSpinner = ({ size = 20, className = '' }) => (
  <div className={`loading-spinner ${className}`.trim()} style={{ width: size, height: size }} aria-label="Loading" />
)

export default LoadingSpinner
