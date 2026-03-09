import prisma from '../../config/database';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function getPurchaseOrders(page: number, limit: number, status?: PurchaseOrderStatus) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);
  return { orders, total };
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
      user: { select: { id: true, name: true } },
    },
  });
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDate?: Date;
  notes?: string;
  createdBy: string;
  items: Array<{ productId: string; orderedQuantity: number; unitPrice: number }>;
}) {
  const orderNumber = `PO-${Date.now()}`;
  return prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId: data.supplierId,
      expectedDate: data.expectedDate,
      notes: data.notes,
      createdBy: data.createdBy,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          totalPrice: new Decimal(item.orderedQuantity).times(item.unitPrice).toNumber(),
        })),
      },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  return prisma.purchaseOrder.update({ where: { id }, data: { status } });
}

export async function receivePurchaseOrder(id: string, userId: string, items?: Array<{ productId: string; receivedQuantity: number }>) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) throw new Error('Purchase order not found');
  if (order.status === PurchaseOrderStatus.RECEIVED) throw new Error('Order already received');
  if (order.status === PurchaseOrderStatus.CANCELLED) throw new Error('Cannot receive a cancelled order');

  const receiveItems = items || order.items.map((item) => ({
    productId: item.productId,
    receivedQuantity: new Decimal(item.orderedQuantity).minus(item.receivedQuantity).toNumber(),
  }));

  await prisma.$transaction(async (tx) => {
    for (const receiveItem of receiveItems) {
      if (receiveItem.receivedQuantity <= 0) continue;

      const orderItem = order.items.find((i) => i.productId === receiveItem.productId);
      if (!orderItem) continue;

      // Update received quantity on order item
      await tx.purchaseOrderItem.updateMany({
        where: { purchaseOrderId: id, productId: receiveItem.productId },
        data: { receivedQuantity: { increment: receiveItem.receivedQuantity } },
      });

      // Create stock IN movement
      await tx.stockMovement.create({
        data: {
          productId: receiveItem.productId,
          type: StockMovementType.IN,
          quantity: receiveItem.receivedQuantity,
          unitPrice: orderItem.unitPrice,
          totalValue: new Decimal(receiveItem.receivedQuantity).times(orderItem.unitPrice),
          reference: order.orderNumber,
          notes: `Received from purchase order ${order.orderNumber}`,
          createdBy: userId,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: receiveItem.productId },
        data: { currentStock: { increment: receiveItem.receivedQuantity } },
      });
    }

    // Check if fully received
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const fullyReceived = updatedItems.every(
      (item) => new Decimal(item.receivedQuantity).greaterThanOrEqualTo(item.orderedQuantity)
    );

    await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: fullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIAL,
        receivedDate: fullyReceived ? new Date() : undefined,
      },
    });
  });

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
}

export async function deletePurchaseOrder(id: string) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) throw new Error('Purchase order not found');
  if (order.status !== PurchaseOrderStatus.DRAFT) throw new Error('Can only delete draft orders');
  return prisma.purchaseOrder.delete({ where: { id } });
}
