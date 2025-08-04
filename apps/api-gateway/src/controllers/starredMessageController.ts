import { NextFunction, Request, Response } from 'express';
import StarredMessage, { IStarredMessage } from '../models/StarredMessage.model';
import createResponse from '../utils/responseHelper';
import enhancedLogger from '../config/logger';

interface StarMessageBody {
  messageContent: string;
}

export const starMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageContent } = req.body as StarMessageBody;
    
    if (!req.user?.userId) {
      res.status(401).json(
        createResponse(401, 'User authentication required')
      );
      return;
    }

    // Check if message content is already starred (to prevent duplicates)
    const existingStarred = await StarredMessage.findOne({
      userId: req.user.userId,
      messageContent: messageContent
    });

    if (existingStarred) {
      res.status(409).json(
        createResponse(409, 'Message is already starred')
      );
      return;
    }

    const starredMessage = new StarredMessage({
      userId: req.user.userId,
      messageContent,
    });

    await starredMessage.save();

    enhancedLogger.info(`Message starred by user ${req.user.userId}: ${starredMessage._id}`);
    
    res.status(201).json(
      createResponse(201, 'Message starred successfully', starredMessage)
    );
  } catch (error: any) {
    enhancedLogger.error('Star message error:', error);
    next(error);
  }
};

export const unstarMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user?.userId) {
      res.status(401).json(
        createResponse(401, 'User authentication required')
      );
      return;
    }

    const deletedMessage = await StarredMessage.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!deletedMessage) {
      res.status(404).json(
        createResponse(404, 'Starred message not found')
      );
      return;
    }

    enhancedLogger.info(`Message unstarred by user ${req.user.userId}: ${id}`);
    
    res.status(200).json(
      createResponse(200, 'Message unstarred successfully')
    );
  } catch (error: any) {
    enhancedLogger.error('Unstar message error:', error);
    next(error);
  }
};

export const getStarredMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json(
        createResponse(401, 'User authentication required')
      );
      return;
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [sortBy as string]: sortDirection };

    const starredMessages = await StarredMessage.find({
      userId: req.user.userId
    })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCount = await StarredMessage.countDocuments({
      userId: req.user.userId
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    enhancedLogger.info(`Retrieved ${starredMessages.length} starred messages for user ${req.user.userId}`);
    
    res.status(200).json(
      createResponse(200, 'Starred messages retrieved successfully', {
        starredMessages,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        }
      })
    );
  } catch (error: any) {
    enhancedLogger.error('Get starred messages error:', error);
    next(error);
  }
};

