import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import {
  dashboardController,
  stockReportController,
  movementReportController,
  supplierReportController,
  auditLogsController,
} from './reports.controller';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get('/dashboard', dashboardController);
reportsRouter.get('/stock', stockReportController);
reportsRouter.get('/movements', movementReportController);
reportsRouter.get('/suppliers', requireRole('ADMIN', 'MANAGER'), supplierReportController);
reportsRouter.get('/audit', requireRole('ADMIN'), auditLogsController);
