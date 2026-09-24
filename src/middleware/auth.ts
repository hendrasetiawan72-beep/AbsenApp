import type { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthUserPayload {
  uid: string;
  id: string;
  email?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  if (!isSupabaseConfigured()) {
    // In dev without Supabase credentials, pass through demo user
    req.user = { uid: 'demo-teacher', id: 'demo-teacher', email: 'hendra.alkindi@gmail.com' };
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
    }
    req.user = {
      uid: user.id,
      id: user.id,
      email: user.email,
      role: (user.user_metadata?.role as string) || 'teacher',
    };
    next();
  } catch (error) {
    console.error('Error verifying Supabase Auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
