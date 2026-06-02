import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Alex Admin',
      passwordHash,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      name: 'Sam Member',
      passwordHash,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Revamp the company marketing site',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
      tasks: {
        create: [
          {
            title: 'Design homepage mockup',
            status: 'DONE',
            assigneeId: member.id,
            createdById: admin.id,
            dueDate: new Date(Date.now() - 2 * 86400000),
          },
          {
            title: 'Implement responsive layout',
            status: 'IN_PROGRESS',
            assigneeId: member.id,
            createdById: admin.id,
            dueDate: new Date(Date.now() + 86400000),
          },
          {
            title: 'Set up CI pipeline',
            status: 'TODO',
            assigneeId: admin.id,
            createdById: admin.id,
            dueDate: new Date(Date.now() - 86400000),
          },
        ],
      },
    },
  });

  console.log('Seed complete:', { admin: admin.email, member: member.email, project: project.name });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
