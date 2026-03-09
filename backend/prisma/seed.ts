import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@inventory.com' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@inventory.com',
        passwordHash,
        name: 'Admin User',
        role: Role.ADMIN,
      },
    });
    console.log('Admin user created: admin@inventory.com / admin123');
  } else {
    console.log('Admin user already exists, skipping seed.');
  }

  // Seed sample categories
  const existingCat = await prisma.category.findUnique({ where: { slug: 'elektronik' } });
  if (!existingCat) {
    const elektronik = await prisma.category.create({
      data: { name: 'Elektronik', slug: 'elektronik', description: 'Elektronik ürünler' },
    });
    await prisma.category.createMany({
      data: [
        { name: 'Telefon', slug: 'telefon', parentId: elektronik.id },
        { name: 'Bilgisayar', slug: 'bilgisayar', parentId: elektronik.id },
      ],
    });

    await prisma.category.createMany({
      data: [
        { name: 'Gıda', slug: 'gida', description: 'Gıda ürünleri' },
        { name: 'Ofis Malzemeleri', slug: 'ofis-malzemeleri', description: 'Ofis için gerekli malzemeler' },
      ],
    });
    console.log('Sample categories created.');
  }

  // Seed sample supplier
  const existingSupplier = await prisma.supplier.findFirst({ where: { name: 'ABC Tedarik A.Ş.' } });
  if (!existingSupplier) {
    await prisma.supplier.create({
      data: {
        name: 'ABC Tedarik A.Ş.',
        email: 'info@abctedarik.com',
        phone: '+90 212 555 0001',
        contactPerson: 'Ahmet Yılmaz',
        address: 'İstanbul, Türkiye',
      },
    });
    console.log('Sample supplier created.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
