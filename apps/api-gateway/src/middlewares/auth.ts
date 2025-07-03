import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config/config';
import ApiError from '../utils/ApiError';

export interface UserPayload {
  email: string;
  name: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Access token is required');
  }

  const token = authHeader.split(' ')[1]; 
  
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

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  if (!req.user.isAdmin) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
  }

  next();
};
