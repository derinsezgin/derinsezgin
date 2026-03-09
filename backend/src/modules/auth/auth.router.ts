import { Router } from 'express';
import { loginController, getMeController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.get('/me', authenticate, getMeController);
