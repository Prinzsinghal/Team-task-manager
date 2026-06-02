import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.userId },
    select: { projectId: true, role: true, project: { select: { id: true, name: true } } },
  });

  const projectIds = memberships.map((m) => m.projectId);
  const now = new Date();

  const [tasks, statusGroups] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    }),
  ]);

  const myTasks = tasks.filter((t) => t.assigneeId === req.userId);
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status !== 'DONE'
  );
  const dueSoon = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    const diff = t.dueDate.getTime() - now.getTime();
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
  });

  const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count.status;
  }

  res.json({
    summary: {
      projectCount: memberships.length,
      totalTasks: tasks.length,
      myTasks: myTasks.length,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      statusCounts,
    },
    projects: memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      role: m.role,
    })),
    overdue: overdue.slice(0, 10),
    dueSoon: dueSoon.slice(0, 10),
    myTasks: myTasks.slice(0, 10),
    recentTasks: tasks.slice(0, 10),
  });
});

export default router;
