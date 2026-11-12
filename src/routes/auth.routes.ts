import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db';
import { verifyJWT, AuthenticatedRequest, AuthUser } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'studiospace_super_secure_jwt_secret_2026';
const isProduction = process.env.NODE_ENV === 'production';

// Helper to set HTTPOnly cookie
const setAuthCookie = (res: Response, user: AuthUser) => {
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, image: user.image },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// 1. Register endpoint with strict password validation
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, photoUrl, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Password validation: min 6 chars, >= 1 uppercase, >= 1 lowercase
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const isLongEnough = password.length >= 6;

    if (!hasUpperCase || !hasLowerCase || !isLongEnough) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long and contain at least one uppercase and one lowercase letter.',
      });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      photoUrl: photoUrl || '',
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in.',
      userId: result.insertedId,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// 2. Login endpoint (Email & Password)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.photoUrl,
    };

    setAuthCookie(res, authUser);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully! 🚀',
      user: authUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// 3. Social Login (Google)
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { name, email, photoUrl } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for Google login.' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      const newUser = {
        name: name || 'Creator',
        email: email.toLowerCase(),
        photoUrl: photoUrl || '',
        provider: 'google',
        createdAt: new Date(),
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.photoUrl,
    };

    setAuthCookie(res, authUser);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful! 🚀',
      user: authUser,
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during Google login.' });
  }
});

// 4. Current user session (reads HTTPOnly cookie)
router.get('/me', verifyJWT, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// 5. Logout endpoint (clears cookie)
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export default router;
