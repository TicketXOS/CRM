import { User } from '../entities/User';

// Mở rộng kiểu Express Request, để req.user là hợp lệ
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {}
