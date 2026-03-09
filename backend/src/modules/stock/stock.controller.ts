import { Response } from 'express';
import { z } from 'zod';
import { StockMovementType } from '@prisma/client';
import { getMovements, createMovement, getMovementById } from './stock.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSchema = z.object({
  productId: z.string(),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function listMovements(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { movements, total } = await getMovements(page, limit, {
    productId: req.query.productId as string,
    type: req.query.type as StockMovementType,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  });
  return sendPaginated(res, movements, total, page, limit);
}

export async function getMovement(req: AuthRequest, res: Response) {
  const movement = await getMovementById(req.params.id);
  if (!movement) return sendError(res, 'Movement not found', 404);
  return sendSuccess(res, movement);
}

export async function createMovementController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const movement = await createMovement({ ...parsed.data, createdBy: req.user!.userId });
    return sendSuccess(res, movement, 'Stock movement created', 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}
