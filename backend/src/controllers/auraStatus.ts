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

export async function getAuraStatus(_req: Request, res: Response) {
  const geometry: Organ = (await geometryUp()) ? 'up' : 'down';
  res.json({
    organs: {
      geometry,
      canvas: 'idle' as const,
      nesting: 'asleep' as const,
    },
    proposals: { pending: 0 },
    doors: { pending: 0 },
  });
}
