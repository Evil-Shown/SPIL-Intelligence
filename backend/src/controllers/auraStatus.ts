import type { Request, Response } from 'express';

type Organ = 'up' | 'down' | 'awake' | 'idle' | 'asleep';

const SHAPES_URL = process.env.SHAPES_SERVICE_URL ?? 'http://localhost:8092';

async function geometryUp(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${SHAPES_URL}/v1/shapes/version`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

import * as kernel from '../kernel/index.js';

export async function getAuraStatus(_req: Request, res: Response) {
  const geometry: Organ = (await geometryUp()) ? 'up' : 'down';

  // Real 24h metrics from append-only event store
  const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const counts = await kernel.countSince(past24h);

  res.json({
    organs: {
      geometry,
      canvas: 'idle' as const,
      nesting: 'asleep' as const,
    },
    // Amber denotes awaiting human signoff. Compensable executions are cyan (executed. logged.).
    // Until a Proposal entity exists in Phase 2, pending proposals is honestly 0.
    proposals: { pending: 0 },
    doors: { pending: counts.refused }, // Actual critical refusals recorded in event store
  });
}
