import { Router } from 'express';
import { body, param } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireProjectMember, requireProjectAdmin } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.userId },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  res.json({
    projects: memberships.map((m) => ({
      ...m.project,
      role: m.role,
      memberCount: m.project._count.members,
      taskCount: m.project._count.tasks,
    })),
  });
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  handleValidation,
  async (req, res) => {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: req.userId,
        members: {
          create: { userId: req.userId, role: 'ADMIN' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    res.status(201).json({ project: { ...project, role: 'ADMIN' } });
  }
);

router.get(
  '/:projectId',
  [param('projectId').notEmpty()],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ project: { ...project, role: req.projectRole } });
  }
);

router.patch(
  '/:projectId',
  [
    param('projectId').notEmpty(),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  handleValidation,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const { name, description } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;

    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ project });
  }
);

router.delete(
  '/:projectId',
  [param('projectId').notEmpty()],
  handleValidation,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  }
);

export default router;
