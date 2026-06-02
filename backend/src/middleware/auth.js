import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireProjectMember(req, res, next) {
  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.userId } },
  });

  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }

  req.membership = membership;
  req.projectRole = membership.role;
  next();
}

export function requireProjectAdmin(req, res, next) {
  if (req.projectRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
