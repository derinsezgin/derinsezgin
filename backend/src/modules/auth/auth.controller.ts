import { Request, Response } from 'express';
import { z } from 'zod';
import { login, getMe } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation error', 422, parsed.error.errors);

  try {
    const result = await login(parsed.data.email, parsed.data.password);
    return sendSuccess(res, result, 'Login successful');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return sendError(res, message, 401);
  }
}

export async function getMeController(req: AuthRequest, res: Response) {
  try {
    const user = await getMe(req.user!.userId);
    return sendSuccess(res, user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return sendError(res, message, 404);
  }
}
