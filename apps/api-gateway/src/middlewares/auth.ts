import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config/config';
import ApiError from '../utils/ApiError';

// User payload interface
export interface UserPayload {
  email: string;
  name: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

// Extend Request interface to include user data
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user data to request object
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Access token is required');
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Access token is required');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token verification failed');
    }
  }
};

/**
 * Admin Authorization Middleware
 * Requires user to be authenticated and have admin privileges
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  if (!req.user.isAdmin) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
  }

  next();
};

/**
 * Optional JWT Authentication Middleware
 * Adds user data to request if token is present, but doesn't fail if missing
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    req.user = decoded;
  } catch {
    // Silently ignore token errors for optional auth
  }
  
  next();
};
