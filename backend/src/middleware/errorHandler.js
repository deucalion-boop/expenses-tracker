const errorHandler = (err, req, res, next) => {
  console.error('ERROR HANDLER:', err)

  if (res.headersSent) {
    return next(err)
  }

  const message = err.message || 'Something went wrong'
  const statusCode = err.statusCode || 500

  return res.status(statusCode).json({
    success: false,
    message,
  })
}

export default errorHandler
