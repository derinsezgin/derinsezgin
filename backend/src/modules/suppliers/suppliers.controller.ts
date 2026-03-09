import { Response } from 'express';
import { z } from 'zod';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, getSupplierOrders } from './suppliers.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  taxNumber: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

export async function listSuppliers(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const { suppliers, total } = await getSuppliers(page, limit, search);
  return sendPaginated(res, suppliers, total, page, limit);
}

export async function getSupplier(req: AuthRequest, res: Response) {
  const supplier = await getSupplierById(req.params.id);
  if (!supplier) return sendError(res, 'Supplier not found', 404);
  return sendSuccess(res, supplier);
}

export async function createSupplierController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  const supplier = await createSupplier(parsed.data);
  return sendSuccess(res, supplier, 'Supplier created', 201);
}

export async function updateSupplierController(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const supplier = await updateSupplier(req.params.id, parsed.data);
    return sendSuccess(res, supplier, 'Supplier updated');
  } catch {
    return sendError(res, 'Supplier not found', 404);
  }
}

export async function deleteSupplierController(req: AuthRequest, res: Response) {
  try {
    await deleteSupplier(req.params.id);
    return sendSuccess(res, null, 'Supplier deleted');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}

export async function getSupplierOrdersController(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { orders, total } = await getSupplierOrders(req.params.id, page, limit);
  return sendPaginated(res, orders, total, page, limit);
}
