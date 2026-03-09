import { Response } from 'express';
import { getDashboardStats, getStockReport, getMovementReport, getSupplierReport, getAuditLogs } from './reports.service';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function dashboardController(_req: AuthRequest, res: Response) {
  const stats = await getDashboardStats();
  return sendSuccess(res, stats);
}

export async function stockReportController(_req: AuthRequest, res: Response) {
  const data = await getStockReport();
  return sendSuccess(res, data);
}

export async function movementReportController(req: AuthRequest, res: Response) {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const data = await getMovementReport(startDate, endDate);
  return sendSuccess(res, data);
}

export async function supplierReportController(_req: AuthRequest, res: Response) {
  const data = await getSupplierReport();
  return sendSuccess(res, data);
}

export async function auditLogsController(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const { logs, total } = await getAuditLogs(page, limit);
  return sendPaginated(res, logs, total, page, limit);
}
