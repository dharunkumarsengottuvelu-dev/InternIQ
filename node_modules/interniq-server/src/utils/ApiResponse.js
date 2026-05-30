/**
 * Standard API response envelope factory.
 * All endpoints return this consistent shape.
 */
export class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.error = null;
    if (meta) this.meta = meta;
  }

  static success(res, message, data = null, statusCode = 200, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created(res, message, data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  static accepted(res, message, data = null) {
    return ApiResponse.success(res, message, data, 202);
  }

  static paginated(res, message, data, { page, limit, total }) {
    return ApiResponse.success(res, message, data, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  static error(res, statusCode, message, errorCode = 'ERROR', details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: { code: errorCode, details },
    });
  }
}

export default ApiResponse;
