import { UserPayload } from '../middlewares/auth';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
