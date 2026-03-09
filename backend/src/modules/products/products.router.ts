import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import {
  listProducts, getProduct, createProductController, updateProductController,
  deleteProductController, listLowStockProducts, getProductMovementsController,
} from './products.controller';

export const productsRouter = Router();

productsRouter.use(authenticate);

productsRouter.get('/', listProducts);
productsRouter.get('/low-stock', listLowStockProducts);
productsRouter.get('/:id', getProduct);
productsRouter.get('/:id/movements', getProductMovementsController);
productsRouter.post('/', requireRole('ADMIN', 'MANAGER'), createProductController);
productsRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), updateProductController);
productsRouter.delete('/:id', requireRole('ADMIN'), deleteProductController);
