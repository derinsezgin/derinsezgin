import prisma from '../../config/database';

export async function getCategories() {
  return prisma.category.findMany({
    include: { children: true },
    where: { parentId: null },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { children: true, parent: true },
  });
}

export async function createCategory(data: { name: string; slug: string; description?: string; parentId?: string }) {
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error('Slug already in use');
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; description?: string; parentId?: string | null }) {
  if (data.slug) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) throw new Error('Slug already in use');
  }
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const hasProducts = await prisma.product.count({ where: { categoryId: id } });
  if (hasProducts > 0) throw new Error('Cannot delete category with existing products');
  return prisma.category.delete({ where: { id } });
}
