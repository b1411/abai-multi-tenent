import { PrismaClient } from '@prisma/client';
import { UserRole } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: existingAdmin.role,
      });
      return existingAdmin;
    }

    console.log('🔨 Creating admin user...');
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Создаем админа
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@abai.edu.kz',
        password: hashedPassword,
        name: 'Admin',
        surname: 'Administrator',
        role: UserRole.ADMIN,
      },
    });

    console.log('✅ Admin user created successfully:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    console.log('🔑 Login credentials:');
    console.log('Email: admin@abai.edu.kz');
    console.log('Password: admin123');

    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем функцию
createAdminUser()
  .then(() => {
    console.log('🎉 Admin user setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create admin user:', error);
    process.exit(1);
  });
