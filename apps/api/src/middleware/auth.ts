import type { Request, Response, NextFunction } from 'express';
import { findUserById } from '../store/userStore.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token) {
    res.status(401).json({ message: '请先登录' });
    return;
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const userId = decoded.split(':')[0];
    const user = findUserById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: '需要管理员权限' });
      return;
    }
    (req as Request & { adminUser: typeof user }).adminUser = user;
    next();
  } catch {
    res.status(401).json({ message: '登录已失效' });
  }
}
