import { Response } from 'express';
import { z } from 'zod';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts, getProductMovements } from './products.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  unit: z.string().optional(),
  minStockLevel: z.number().min(0).optional(),
});

const updateSchema = createSchema.omit({ sku: true }).partial().extend({ isActive: z.boolean().optional() });

export async function listProducts(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { products, total } = await getProducts(page, limit, {
    categoryId: req.query.categoryId as string,
    supplierId: req.query.supplierId as string,
    search: req.query.search as string,
    isActive: req.query.isActive === 'false' ? false : true,
  });
  return sendPaginated(res, products, total, page, limit);
}

export async function listLowStockProducts(_req: AuthRequest, res: Response) {
  const products = await getLowStockProducts();
  return sendSuccess(res, products);
}

export async function getProduct(req: AuthRequest, res: Response) {
  const product = await getProductById(req.params.id);
  if (!product) return sendError(res, 'Product not found', 404);
  return sendSuccess(res, product);
}

export async function getProductMovementsController(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { movements, total } = await getProductMovements(req.params.id, page, limit);
  return sendPaginated(res, movements, total, page, limit);
}

export async function createProductController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const product = await createProduct(parsed.data);
    return sendSuccess(res, product, 'Product created', 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message);
  }
}

export async function updateProductController(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const product = await updateProduct(req.params.id, parsed.data);
    return sendSuccess(res, product, 'Product updated');
  } catch {
    return sendError(res, 'Product not found', 404);
  }
}

export async function deleteProductController(req: AuthRequest, res: Response) {
  try {
    await deleteProduct(req.params.id);
    return sendSuccess(res, null, 'Product deleted');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}
