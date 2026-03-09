import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { listSuppliers, getSupplier, createSupplierController, updateSupplierController, deleteSupplierController, getSupplierOrdersController } from './suppliers.controller';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);

suppliersRouter.get('/', listSuppliers);
suppliersRouter.get('/:id', getSupplier);
suppliersRouter.get('/:id/orders', getSupplierOrdersController);
suppliersRouter.post('/', requireRole('ADMIN', 'MANAGER'), createSupplierController);
suppliersRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), updateSupplierController);
suppliersRouter.delete('/:id', requireRole('ADMIN'), deleteSupplierController);
