import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { listCategories, getCategory, createCategoryController, updateCategoryController, deleteCategoryController } from './categories.controller';

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);

categoriesRouter.get('/', listCategories);
categoriesRouter.get('/:id', getCategory);
categoriesRouter.post('/', requireRole('ADMIN', 'MANAGER'), createCategoryController);
categoriesRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), updateCategoryController);
categoriesRouter.delete('/:id', requireRole('ADMIN'), deleteCategoryController);
