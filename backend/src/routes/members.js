import { Router } from 'express';
import { body, param } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireProjectMember, requireProjectAdmin } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use('/:projectId', [param('projectId').notEmpty()], handleValidation, requireProjectMember);

router.get('/:projectId/members', async (req, res) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  res.json({ members });
});

router.post(
  '/:projectId/members',
  requireProjectAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  handleValidation,
  async (req, res) => {
    const { email, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found. They must sign up first.' });
    }

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: req.params.projectId, userId: user.id },
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'User is already a project member' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.projectId,
        userId: user.id,
        role,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ member });
  }
);

router.patch(
  '/:projectId/members/:memberId',
  requireProjectAdmin,
  [
    param('memberId').notEmpty(),
    body('role').isIn(['ADMIN', 'MEMBER']),
  ],
  handleValidation,
  async (req, res) => {
    const member = await prisma.projectMember.findFirst({
      where: { id: req.params.memberId, projectId: req.params.projectId },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
    });
    if (member.userId === project.ownerId && req.body.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Project owner must remain an admin' });
    }

    const adminCount = await prisma.projectMember.count({
      where: { projectId: req.params.projectId, role: 'ADMIN' },
    });
    if (member.role === 'ADMIN' && req.body.role === 'MEMBER' && adminCount <= 1) {
      return res.status(400).json({ error: 'Project must have at least one admin' });
    }

    const updated = await prisma.projectMember.update({
      where: { id: req.params.memberId },
      data: { role: req.body.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ member: updated });
  }
);

router.delete(
  '/:projectId/members/:memberId',
  requireProjectAdmin,
  [param('memberId').notEmpty()],
  handleValidation,
  async (req, res) => {
    const member = await prisma.projectMember.findFirst({
      where: { id: req.params.memberId, projectId: req.params.projectId },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
    });
    if (member.userId === project.ownerId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    await prisma.projectMember.delete({ where: { id: req.params.memberId } });
    res.json({ message: 'Member removed' });
  }
);

export default router;
