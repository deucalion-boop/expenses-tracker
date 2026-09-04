const errorHandler = (err, req, res, next) => {
  console.error(JSON.stringify({
    level: 'error', event: 'request_error', method: req.method, path: req.originalUrl,
    code: err.code || null, message: err.message || 'Something went wrong', timestamp: new Date().toISOString(),
  }))

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
