import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { listUsers, getUser, createUserController, updateUserController, deleteUserController } from './users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate, requireRole('ADMIN'));

usersRouter.get('/', listUsers);
usersRouter.get('/:id', getUser);
usersRouter.post('/', createUserController);
usersRouter.put('/:id', updateUserController);
usersRouter.delete('/:id', deleteUserController);
