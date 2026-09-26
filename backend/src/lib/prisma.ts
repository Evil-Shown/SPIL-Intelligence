import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Enforce SQLite WAL (Write-Ahead Logging) mode for concurrent audit log performance
prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL').catch((err) => {
  console.warn('Could not set WAL mode on SQLite:', err);
});
