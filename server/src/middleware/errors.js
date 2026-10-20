export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function notFoundHandler(request, response, next) {
  next(new ApiError(404, 'NOT_FOUND', 'The requested endpoint was not found.'))
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  const production = process.env.NODE_ENV === 'production'
  let status = error.status || 500
  let code = error.code || 'INTERNAL_SERVER_ERROR'
  let message = error.message || 'An unexpected error occurred.'
  let details = error.details

  if (error.type === 'entity.parse.failed') {
    status = 400
    code = 'INVALID_JSON'
    message = 'Request body must contain valid JSON.'
  } else if (error.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION_ERROR'
    message = 'Request validation failed.'
    details = Object.fromEntries(Object.entries(error.errors || {}).map(([field, issue]) => [field, issue.message]))
  } else if (error.name === 'CastError') {
    status = 400
    code = 'INVALID_VALUE'
    message = 'A request value is invalid.'
    details = undefined
  }

  if (status >= 500) {
    if (!error.code) {
      code = 'INTERNAL_SERVER_ERROR'
      message = 'An unexpected server error occurred.'
    }
    details = undefined
  }

  const errorBody = { code, message }
  if (details && !production) errorBody.details = details
  return response.status(status).json({ success: false, error: errorBody })
}
