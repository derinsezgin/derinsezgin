import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface ProductFilter {
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
  search?: string;
  isActive?: boolean;
}

export async function getProducts(page: number, limit: number, filter: ProductFilter = {}) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};

  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.supplierId) where.supplierId = filter.supplierId;
  if (typeof filter.isActive !== 'undefined') where.isActive = filter.isActive;
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { sku: { contains: filter.search, mode: 'insensitive' } },
      { barcode: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  if (filter.lowStock) {
    const lowStockProducts = products.filter(
      (p) => new Decimal(p.currentStock).lessThan(new Decimal(p.minStockLevel))
    );
    return { products: lowStockProducts, total: lowStockProducts.length };
  }

  return { products, total };
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });
  return products.filter(
    (p) => new Decimal(p.currentStock).lessThanOrEqualTo(new Decimal(p.minStockLevel))
  );
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
    },
  });
}

export async function getProductMovements(productId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { productId },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where: { productId } }),
  ]);
  return { movements, total };
}

export async function createProduct(data: {
  sku: string; barcode?: string; name: string; description?: string;
  categoryId?: string; supplierId?: string; unitPrice?: number; costPrice?: number;
  unit?: string; minStockLevel?: number;
}) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new Error('SKU already in use');
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: Partial<{
  name: string; description: string; barcode: string; categoryId: string; supplierId: string;
  unitPrice: number; costPrice: number; unit: string; minStockLevel: number; isActive: boolean;
}>) {
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  const hasMovements = await prisma.stockMovement.count({ where: { productId: id } });
  if (hasMovements > 0) throw new Error('Cannot delete product with stock movements history');
  return prisma.product.delete({ where: { id } });
}
