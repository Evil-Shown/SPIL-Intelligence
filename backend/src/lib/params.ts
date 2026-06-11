import type { Request } from 'express';

export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}
