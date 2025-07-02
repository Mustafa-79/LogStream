import { NextFunction, Request, Response } from 'express';
import createResponse from "../utils/responseHelper";
import { userService } from '../services';

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
