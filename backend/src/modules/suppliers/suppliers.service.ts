import prisma from '../../config/database';

export async function getSuppliers(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : {};
  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.supplier.count({ where }),
  ]);
  return { suppliers, total };
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

export async function createSupplier(data: {
  name: string; email?: string; phone?: string; address?: string; contactPerson?: string; taxNumber?: string;
}) {
  return prisma.supplier.create({ data });
}

export async function updateSupplier(id: string, data: Partial<{
  name: string; email: string; phone: string; address: string; contactPerson: string; taxNumber: string; isActive: boolean;
}>) {
  return prisma.supplier.update({ where: { id }, data });
}

export async function deleteSupplier(id: string) {
  const hasOrders = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (hasOrders > 0) throw new Error('Cannot delete supplier with existing purchase orders');
  return prisma.supplier.delete({ where: { id } });
}

export async function getSupplierOrders(id: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      skip,
      take: limit,
      include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where: { supplierId: id } }),
  ]);
  return { orders, total };
}
