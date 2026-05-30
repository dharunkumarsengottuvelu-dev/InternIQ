import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after express-validator chain.
 * Collects all validation errors and returns a structured 400.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(({ path, msg }) => ({ field: path, message: msg }));
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details);
  }
  next();
};

export default validate;
