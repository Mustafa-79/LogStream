import { NextFunction, Request, Response } from 'express';
import MongoMCPClient, { UserContext, QueryResponse } from '../services/mcpService';
import createResponse from '../utils/responseHelper';
import enhancedLogger from '../config/logger';


interface NaturalLanguageQueryBody {
  query: string;
}

const mongoMCPClient = new MongoMCPClient();

const initializeMCPClient = async () => {
  try {
    await mongoMCPClient.initialize();
    enhancedLogger.info('MongoDB MCP client initialized successfully');
  } catch (error: any) {
    enhancedLogger.error('Failed to initialize MCP client:', error);
  }
};

initializeMCPClient();

export const executeNaturalLanguageQuery = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = req.body as NaturalLanguageQueryBody;
    
    if (!req.user?.userId) {
      res.status(401).json(
        createResponse(401, 'User authentication required')
      );
      return;
    }

    const userContext: UserContext = {
      userId: req.user.userId,
      role: req.user.isAdmin ? 'admin' : 'user',
    };

    console.log("User Context:", userContext);

    const result: QueryResponse = await mongoMCPClient.executeNaturalLanguageQuery(query, userContext);
    
    enhancedLogger.info(`Natural language query executed by user ${req.user.userId}: ${query.substring(0, 100)}...`);
    
    res.status(200).json(
      createResponse(200, 'Query executed successfully', result)
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    enhancedLogger.error('Natural language query error:', error);
    next(error);
  }
};

export { mongoMCPClient };