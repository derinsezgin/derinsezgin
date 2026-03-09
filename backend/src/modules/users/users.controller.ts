import { Response } from 'express';
import { z } from 'zod';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './users.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role).optional().default(Role.STAFF),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function listUsers(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { users, total } = await getUsers(page, limit);
  return sendPaginated(res, users, total, page, limit);
}

export async function getUser(req: AuthRequest, res: Response) {
  const user = await getUserById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, user);
}

export async function createUserController(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const user = await createUser(parsed.data);
    return sendSuccess(res, user, 'User created', 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message);
  }
}

export async function updateUserController(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);
  try {
    const user = await updateUser(req.params.id, parsed.data);
    return sendSuccess(res, user, 'User updated');
  } catch {
    return sendError(res, 'User not found', 404);
  }
}

export async function deleteUserController(req: AuthRequest, res: Response) {
  try {
    await deleteUser(req.params.id);
    return sendSuccess(res, null, 'User deleted');
  } catch {
    return sendError(res, 'User not found', 404);
  }
}
