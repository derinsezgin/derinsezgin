import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    totalSuppliers,
    openOrders,
    totalMovements,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } } }),
    prisma.stockMovement.count(),
  ]);

  // Low stock products
  const allActiveProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, currentStock: true, minStockLevel: true, unit: true },
  });
  const lowStockProducts = allActiveProducts.filter((p) =>
    new Decimal(p.currentStock).lessThanOrEqualTo(new Decimal(p.minStockLevel))
  );

  // Total stock value
  const stockValueResult = await prisma.product.aggregate({
    _sum: { costPrice: true },
    where: { isActive: true },
  });

  // Recent movements (last 5)
  const recentMovements = await prisma.stockMovement.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { id: true, name: true } },
    },
  });

  return {
    totalProducts,
    activeProducts,
    totalCategories,
    totalSuppliers,
    openOrders,
    totalMovements,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 10),
    totalStockValue: stockValueResult._sum.costPrice || 0,
    recentMovements,
  };
}

export async function getStockReport() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category?.name ?? null,
    supplier: p.supplier?.name ?? null,
    unit: p.unit,
    currentStock: p.currentStock,
    minStockLevel: p.minStockLevel,
    costPrice: p.costPrice,
    unitPrice: p.unitPrice,
    stockValue: new Decimal(p.currentStock).times(p.costPrice).toNumber(),
    isLowStock: new Decimal(p.currentStock).lessThanOrEqualTo(new Decimal(p.minStockLevel)),
  }));
}

export async function getMovementReport(startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    totalIn: movements.filter((m) => m.type === 'IN').reduce((sum, m) => sum + Number(m.quantity), 0),
    totalOut: movements.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + Number(m.quantity), 0),
    totalAdjustments: movements.filter((m) => m.type === 'ADJUSTMENT').length,
    totalReturns: movements.filter((m) => m.type === 'RETURN').length,
    totalMovements: movements.length,
  };

  return { movements, summary };
}

export async function getSupplierReport() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: {
      purchaseOrders: {
        select: {
          id: true,
          status: true,
          orderDate: true,
          items: { select: { totalPrice: true, orderedQuantity: true, receivedQuantity: true } },
        },
      },
      products: { select: { id: true, isActive: true } },
    },
  });

  return suppliers.map((s) => {
    const totalOrders = s.purchaseOrders.length;
    const completedOrders = s.purchaseOrders.filter((o) => o.status === 'RECEIVED').length;
    const totalSpend = s.purchaseOrders.reduce(
      (sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + Number(i.totalPrice), 0),
      0
    );
    const activeProducts = s.products.filter((p) => p.isActive).length;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      isActive: s.isActive,
      totalOrders,
      completedOrders,
      pendingOrders: totalOrders - completedOrders,
      totalSpend,
      activeProducts,
    };
  });
}

export async function getAuditLogs(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count(),
  ]);
  return { logs, total };
}
