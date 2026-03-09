import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrderController,
  updateStatusController,
  receivePurchaseOrderController,
  deletePurchaseOrderController,
} from './purchase-orders.controller';

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.use(authenticate);

purchaseOrdersRouter.get('/', listPurchaseOrders);
purchaseOrdersRouter.get('/:id', getPurchaseOrder);
purchaseOrdersRouter.post('/', requireRole('ADMIN', 'MANAGER'), createPurchaseOrderController);
purchaseOrdersRouter.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateStatusController);
purchaseOrdersRouter.post('/:id/receive', requireRole('ADMIN', 'MANAGER'), receivePurchaseOrderController);
purchaseOrdersRouter.delete('/:id', requireRole('ADMIN'), deletePurchaseOrderController);
