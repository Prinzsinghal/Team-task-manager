import { Router } from 'express';
import { body, param } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireProjectMember } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
};

router.use(authenticate);

router.get('/tasks', async (req, res) => {
  const { status, projectId, assignedToMe } = req.query;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.userId },
    select: { projectId: true },
  });
  const projectIds = memberships.map((m) => m.projectId);

  const where = {
    projectId: projectId ? projectId : { in: projectIds },
  };
  if (status) where.status = status;
  if (assignedToMe === 'true') where.assigneeId = req.userId;

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  res.json({ tasks });
});

router.get(
  '/:projectId/tasks',
  [param('projectId').notEmpty()],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId },
      include: taskInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ tasks });
  }
);

router.post(
  '/:projectId/tasks',
  [
    param('projectId').notEmpty(),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('dueDate').optional().isISO8601(),
    body('assigneeId').optional().isString(),
  ],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const { title, description, status, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: req.params.projectId, userId: assigneeId },
        },
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId: req.params.projectId,
        title,
        description: description || null,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        createdById: req.userId,
      },
      include: taskInclude,
    });

    res.status(201).json({ task });
  }
);

router.get(
  '/:projectId/tasks/:taskId',
  [param('projectId').notEmpty(), param('taskId').notEmpty()],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, projectId: req.params.projectId },
      include: taskInclude,
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task });
  }
);

router.patch(
  '/:projectId/tasks/:taskId',
  [
    param('projectId').notEmpty(),
    param('taskId').notEmpty(),
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('assigneeId').optional({ nullable: true }).isString(),
  ],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.taskId, projectId: req.params.projectId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, status, dueDate, assigneeId } = req.body;
    const data = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        data.assigneeId = null;
      } else {
        const assigneeMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: { projectId: req.params.projectId, userId: assigneeId },
          },
        });
        if (!assigneeMember) {
          return res.status(400).json({ error: 'Assignee must be a project member' });
        }
        data.assigneeId = assigneeId;
      }
    }

    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data,
      include: taskInclude,
    });

    res.json({ task });
  }
);

router.delete(
  '/:projectId/tasks/:taskId',
  [param('projectId').notEmpty(), param('taskId').notEmpty()],
  handleValidation,
  requireProjectMember,
  async (req, res) => {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.taskId, projectId: req.params.projectId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  }
);

export default router;
