import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { listMovements, getMovement, createMovementController } from './stock.controller';

export const stockRouter = Router();

stockRouter.use(authenticate);

stockRouter.get('/movements', listMovements);
stockRouter.get('/movements/:id', getMovement);
stockRouter.post('/movements', createMovementController);
