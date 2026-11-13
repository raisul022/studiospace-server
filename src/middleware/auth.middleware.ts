import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'studiospace_super_secure_jwt_secret_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  cookies: any;
  body: any;
  params: any;
}

export const verifyJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Authentication token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};
