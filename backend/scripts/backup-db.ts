import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBackup() {
  const rootDir = path.resolve(__dirname, '..');
  const backupDir = path.join(rootDir, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `spil-dev-${timestamp}.db`);

  console.log(`[SQLITE BACKUP] Starting database backup...`);
  console.log(`Destination: ${backupFile}`);

  // Use SQLite online backup command (safe during active WAL operations)
  // For SQLite, vacuum into writes a pristine atomic copy
  const escapedPath = backupFile.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedPath}'`);

  const stats = fs.statSync(backupFile);
  console.log(`[SQLITE BACKUP] Completed successfully. Size: ${(stats.size / 1024).toFixed(1)} KB`);
  process.exit(0);
}

runBackup().catch((err) => {
  console.error('[SQLITE BACKUP] Failed:', err);
  process.exit(1);
});
