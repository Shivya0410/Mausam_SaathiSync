/**
 * Error types and status mapping for the /api/v1 boundary.
 *
 * One error shape for every failure, so callers never have to distinguish
 * between "the upstream said no" and "we said no". Upstream messages and
 * stack traces are never forwarded to the client.
 *
 * Status codes follow section 10 of the architecture brief.
 */

export const ErrorCode = {
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  VALIDATION_FAILED: 'validation_failed',
  RATE_LIMITED: 'rate_limited',
  UPSTREAM_UNAVAILABLE: 'upstream_unavailable',
  INTERNAL: 'internal_error',
};

const STATUS_BY_CODE = {
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_FAILED]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.UPSTREAM_UNAVAILABLE]: 503,
  [ErrorCode.INTERNAL]: 500,
};

/**
 * The only error type route handlers should throw deliberately.
 *
 * `message` is user-safe by construction: callers are expected to pass text
 * they are happy to show a stranger. `details` carries structured, non-
 * sensitive context such as which field failed validation.
 */
export class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS_BY_CODE[code] ?? 500;
    this.details = details;
  }

  static unauthenticated(message = 'Authentication required.') {
    return new ApiError(ErrorCode.UNAUTHENTICATED, message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(ErrorCode.NOT_FOUND, message);
  }

  static conflict(message, details) {
    return new ApiError(ErrorCode.CONFLICT, message, details);
  }

  static validationFailed(fieldErrors) {
    return new ApiError(
      ErrorCode.VALIDATION_FAILED,
      'The request body failed validation.',
      { fields: fieldErrors }
    );
  }

  static upstreamUnavailable(message = 'An upstream service is unavailable. Please try again.') {
    return new ApiError(ErrorCode.UPSTREAM_UNAVAILABLE, message);
  }
}

/**
 * Turn any thrown value into the wire shape.
 *
 * Anything that is not an ApiError is treated as a bug: it is logged with its
 * request id for correlation and reported to the caller as a generic 500. The
 * original message never crosses the boundary, because unexpected errors are
 * exactly the ones most likely to contain connection strings or file paths.
 */
export function toErrorResponse(error, requestId) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          requestId,
        },
      },
    };
  }

  console.error(`[${requestId}] Unhandled error in /api/v1:`, error);

  return {
    status: 500,
    body: {
      error: {
        code: ErrorCode.INTERNAL,
        message: 'Something went wrong. Please try again.',
        requestId,
      },
    },
  };
}
