import prisma from '../../config/database';
import { StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface MovementFilter {
  productId?: string;
  type?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
}

export async function getMovements(page: number, limit: number, filter: MovementFilter = {}) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};

  if (filter.productId) where.productId = filter.productId;
  if (filter.type) where.type = filter.type;
  if (filter.startDate || filter.endDate) {
    where.createdAt = {
      ...(filter.startDate && { gte: filter.startDate }),
      ...(filter.endDate && { lte: filter.endDate }),
    };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { movements, total };
}

export async function createMovement(data: {
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
  createdBy: string;
}) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error('Product not found');

  const quantityDecimal = new Decimal(data.quantity);
  const currentStock = new Decimal(product.currentStock);

  // Validate and compute stock delta
  let stockDelta: Decimal;
  if (data.type === StockMovementType.OUT) {
    if (currentStock.lessThan(quantityDecimal)) {
      throw new Error(`Insufficient stock (current: ${currentStock}, requested: ${quantityDecimal})`);
    }
    stockDelta = quantityDecimal.negated();
  } else if (data.type === StockMovementType.ADJUSTMENT) {
    // ADJUSTMENT: quantity is the new absolute stock value (cycle count)
    if (quantityDecimal.lessThan(0)) throw new Error('Adjustment quantity cannot be negative');
    stockDelta = quantityDecimal.minus(currentStock);
  } else {
    // IN, RETURN: add to stock
    stockDelta = quantityDecimal;
  }

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: quantityDecimal,
        unitPrice: data.unitPrice,
        totalValue: data.unitPrice ? quantityDecimal.times(data.unitPrice) : undefined,
        reference: data.reference,
        notes: data.notes,
        createdBy: data.createdBy,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data: { currentStock: { increment: stockDelta.toNumber() } },
    }),
  ]);

  return movement;
}

export async function getMovementById(id: string) {
  return prisma.stockMovement.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      user: { select: { id: true, name: true } },
    },
  });
}
