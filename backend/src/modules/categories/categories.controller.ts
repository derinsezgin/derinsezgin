import { Response } from 'express';
import { z } from 'zod';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from './categories.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({ parentId: z.string().nullable().optional() });

export async function listCategories(_req: AuthRequest, res: Response) {
  const categories = await getCategories();
  return sendSuccess(res, categories);
}

export async function getCategory(req: AuthRequest, res: Response) {
  const category = await getCategoryById(req.params.id);
  if (!category) return sendError(res, 'Category not found', 404);
  return sendSuccess(res, category);
}

export async function createCategoryController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const category = await createCategory(parsed.data);
    return sendSuccess(res, category, 'Category created', 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message);
  }
}

export async function updateCategoryController(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const category = await updateCategory(req.params.id, parsed.data);
    return sendSuccess(res, category, 'Category updated');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 404);
  }
}

export async function deleteCategoryController(req: AuthRequest, res: Response) {
  try {
    await deleteCategory(req.params.id);
    return sendSuccess(res, null, 'Category deleted');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 400);
  }
}
