import { NextFunction, Request, Response } from 'express';
import createResponse from "../utils/responseHelper";
import { userService } from '../services';
import { googleDirectoryService } from '../services/googleDirectoryService';
import logger from '../config/logger';

// User controller debug logger
const userControllerDebugger = logger.withTraceId('USER_CTRL');

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json(
      createResponse(200, 'Users fetched successfully', users)
    );
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      res.status(400).json(
        createResponse(400, 'Username and email are required', null)
      );
      return;
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      res.status(200).json(
        createResponse(200, 'User already exists', existingUser)
      );
      return;
    }

    // Create new user
    const newUser = await userService.createUser({
      username,
      email,
      active: true
    });

    res.status(201).json(
      createResponse(201, 'User created successfully', newUser)
    );
  } catch (error) {
    userControllerDebugger.error('Error creating user:', error);
    next(error);
  }
};

export const searchGoogleDirectory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json(
        createResponse(400, 'Query parameter is required', null)
      );
      return;
    }

    if (query.trim().length < 2) {
      res.status(400).json(
        createResponse(400, 'Query must be at least 2 characters long', null)
      );
      return;
    }

    const users = await googleDirectoryService.searchUsers(query.trim());

    res.status(200).json(
      createResponse(200, 'Google Directory users fetched successfully', users)
    );
  } catch (error) {
    userControllerDebugger.error('Error searching Google Directory:', error);
    next(error);
  }
};
