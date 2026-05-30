/**
 * Custom operational error class with HTTP status code and machine-readable error code.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // distinguish from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory helpers ───────────────────────────────────────
  static badRequest(message, errorCode = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = 'Authentication required', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Insufficient permissions', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(resource = 'Resource', errorCode = 'NOT_FOUND') {
    return new ApiError(404, `${resource} not found`, errorCode);
  }

  static conflict(message, errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static tooManyRequests(message = 'Too many requests', errorCode = 'RATE_LIMITED') {
    return new ApiError(429, message, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}

export default ApiError;
