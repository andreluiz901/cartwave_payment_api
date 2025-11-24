import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@/generated/client';

interface TestDatabase {
  container: StartedPostgreSqlContainer;
  prisma: PrismaClient;
}

const CONTAINER_STARTUP_TIMEOUT = 60000;

export async function setupTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:17')
    .withDatabase('tests')
    .withUsername('postgres')
    .withPassword('postgres')
    .withStartupTimeout(CONTAINER_STARTUP_TIMEOUT)
    .start();

  const connectionString = container.getConnectionUri();

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  return { container, prisma };
}
