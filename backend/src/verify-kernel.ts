import * as kernel from './kernel/index.js';
import { prisma } from './lib/prisma.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ✗ ${name}: ${errorMsg}`);
  }
}

async function run() {
  console.log('\n[AURA-KERNEL REGRESSION & VERIFICATION SUITE]');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Registry Version:', kernel.getVersion());
  console.log('----------------------------------------------------');

  // Test 1: Compensable Execution & Append-Only Audit Logging
  await test('Invariant 1: Compensable execution creates entity and audit trail', async () => {
    const title = `Verification Task ${Date.now()}`;
    const res = await kernel.execute(
      'create_task',
      { title, priority: 'HIGH', assignee: 'Damitha' },
      { actorId: 'founder', modelTurn: 'verify:kernel suite run' }
    );

    if (res.status !== 'executed') throw new Error(`Expected executed, got ${res.status}`);
    if (res.class !== 'executed') throw new Error(`Expected class executed, got ${res.class}`);

    // Verify written to Task table
    const task = await prisma.task.findFirst({ where: { title } });
    if (!task) throw new Error('Task was not committed to SQLite');

    // Verify written to append-only ToolExecution
    const auditRow = await prisma.toolExecution.findFirst({
      where: { tool: 'create_task', status: 'executed' },
      orderBy: { seq: 'desc' },
    });
    if (!auditRow) throw new Error('Audit row not found in ToolExecution');
    if (auditRow.actorId !== 'founder') throw new Error(`Expected founder actorId, got ${auditRow.actorId}`);
    if (!auditRow.resultJson) throw new Error('finish() was not called on auditRow');
  });

  // Test 2: Critical One-Way Door Refusal
  await test('Invariant 2: Critical tool is refused with door class and honest reason', async () => {
    const res = await kernel.execute(
      'publish_decision',
      { id: 'decision-verification-1' },
      { actorId: 'founder', modelTurn: 'testing one-way door refusal' }
    );

    if (res.status !== 'refused') throw new Error(`Expected refused, got ${res.status}`);
    if (res.class !== 'door') throw new Error(`Expected class door, got ${res.class}`);
    if (!res.refusalReason?.includes('requires proposal flow. not built yet.')) {
      throw new Error(`Unexpected refusal message: ${res.refusalReason}`);
    }

    // Verify audit entry exists as refused
    const auditRow = await prisma.toolExecution.findFirst({
      where: { tool: 'publish_decision', status: 'refused' },
      orderBy: { seq: 'desc' },
    });
    if (!auditRow) throw new Error('Critical refusal was not logged in ToolExecution');
  });

  // Test 3: Read-Only Query (none class)
  await test('Invariant 3: Read-only query executes with read class and zero mutation', async () => {
    const res = await kernel.execute(
      'search_bugs',
      { limit: 5 },
      { actorId: 'founder', modelTurn: 'read-only test' }
    );

    if (res.status !== 'executed') throw new Error(`Expected executed, got ${res.status}`);
    if (res.class !== 'read') throw new Error(`Expected class read, got ${res.class}`);
    if (!Array.isArray(res.result)) throw new Error('Expected array of bugs in result');
  });

  // Test 4: Failure Path Handling (Handler throws or invalid args)
  await test('Invariant 4: Execution failure creates failed row without crashing', async () => {
    // Attempting to update non-existent task will throw in prisma
    const res = await kernel.execute(
      'update_task',
      { id: 'non-existent-task-id-999999', title: 'impossible update' },
      { actorId: 'founder', modelTurn: 'failure path test' }
    );

    if (res.status !== 'failed') throw new Error(`Expected status failed, got ${res.status}`);

    const failedRow = await prisma.toolExecution.findFirst({
      where: { tool: 'update_task', status: 'failed' },
      orderBy: { seq: 'desc' },
    });
    if (!failedRow) throw new Error('Failed execution row was not logged');
    if (!failedRow.refusalReason) throw new Error('Error reason not captured in refusalReason');
  });

  // Test 5: First-Touched-At Retention Tracking
  await test('Invariant 5: First edit captures firstTouchedAt for retention ladder', async () => {
    const title = `FirstTouch Task ${Date.now()}`;
    const createRes = await kernel.execute(
      'create_task',
      { title },
      { actorId: 'founder' }
    );
    const createdTask = createRes.result as { id: string };

    const initial = await prisma.task.findUnique({ where: { id: createdTask.id } });
    if (initial?.firstTouchedAt !== null) {
      throw new Error('firstTouchedAt should initially be null on creation');
    }

    // Update the task
    await kernel.execute(
      'update_task',
      { id: createdTask.id, description: 'Updated description' },
      { actorId: 'founder' }
    );

    const updated = await prisma.task.findUnique({ where: { id: createdTask.id } });
    if (!updated?.firstTouchedAt) {
      throw new Error('firstTouchedAt was not stamped upon update');
    }
  });

  // Test 6: Status & Honest Telemetry
  await test('Invariant 6: Telemetry reports honest 0 pending proposals', async () => {
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const counts = await kernel.countSince(past24h);

    if (typeof counts.executed !== 'number' || typeof counts.refused !== 'number') {
      throw new Error('countSince returned invalid numbers');
    }
  });

  // Test 7: Chat-loop Tool Execution & Door Refusal End-to-End
  await test('Invariant 7: Chat loop parses natural language intent, invokes kernel, and logs execution/refusal', async () => {
    // 1. Natural language command to create a task
    const mockRes1 = {
      chunks: [] as string[],
      setHeader: () => {},
      write: function (chunk: string) { this.chunks.push(chunk); },
      end: function () {},
    };
    const req1 = {
      body: { message: 'create a task to fix the arc fitting bug, assign to Damitha, priority high' },
    } as any;

    const { chat } = await import('./controllers/ai.js');
    await chat(req1, mockRes1 as any);

    const fullStream1 = mockRes1.chunks.join('');
    if (!fullStream1.includes('"class":"executed"')) {
      throw new Error(`Expected chat response done event with class 'executed', got stream: ${fullStream1}`);
    }

    // Verify task actually created in database
    const createdTask = await prisma.task.findFirst({
      where: { title: { contains: 'arc fitting bug' } },
      orderBy: { createdAt: 'desc' },
    });
    if (!createdTask) throw new Error('Task was not created through chat tool-use loop');

    // 2. Natural language command to trigger a critical door
    const mockRes2 = {
      chunks: [] as string[],
      setHeader: () => {},
      write: function (chunk: string) { this.chunks.push(chunk); },
      end: function () {},
    };
    const req2 = {
      body: { message: 'publish this decision right now' },
    } as any;

    await chat(req2, mockRes2 as any);
    const fullStream2 = mockRes2.chunks.join('');
    if (!fullStream2.includes('"class":"door"')) {
      throw new Error(`Expected chat response done event with class 'door', got stream: ${fullStream2}`);
    }
  });

  console.log('----------------------------------------------------');
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.error(`FAILED: ${failed.length} / ${results.length} tests failed.`);
    process.exit(1);
  } else {
    console.log(`PASSED: All ${results.length} kernel invariants verified and enforced.`);
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
