import { Response } from 'express';
import { z } from 'zod';
import { PurchaseOrderStatus } from '@prisma/client';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  deletePurchaseOrder,
} from './purchase-orders.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSchema = z.object({
  supplierId: z.string(),
  expectedDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        orderedQuantity: z.number().positive(),
        unitPrice: z.number().min(0),
      })
    )
    .min(1),
});

const receiveSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        receivedQuantity: z.number().min(0),
      })
    )
    .optional(),
});

export async function listPurchaseOrders(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as PurchaseOrderStatus | undefined;
  const { orders, total } = await getPurchaseOrders(page, limit, status);
  return sendPaginated(res, orders, total, page, limit);
}

export async function getPurchaseOrder(req: AuthRequest, res: Response) {
  const order = await getPurchaseOrderById(req.params.id);
  if (!order) return sendError(res, 'Purchase order not found', 404);
  return sendSuccess(res, order);
}

export async function createPurchaseOrderController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const order = await createPurchaseOrder({ ...parsed.data, createdBy: req.user!.userId });
    return sendSuccess(res, order, 'Purchase order created', 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}

export async function updateStatusController(req: AuthRequest, res: Response) {
  const { status } = req.body;
  if (!Object.values(PurchaseOrderStatus).includes(status)) {
    return sendError(res, 'Invalid status', 422);
  }
  try {
    const order = await updatePurchaseOrderStatus(req.params.id, status);
    return sendSuccess(res, order, 'Status updated');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}

export async function receivePurchaseOrderController(req: AuthRequest, res: Response) {
  const parsed = receiveSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const order = await receivePurchaseOrder(req.params.id, req.user!.userId, parsed.data.items);
    return sendSuccess(res, order, 'Purchase order received');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}

export async function deletePurchaseOrderController(req: AuthRequest, res: Response) {
  try {
    await deletePurchaseOrder(req.params.id);
    return sendSuccess(res, null, 'Purchase order deleted');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}
