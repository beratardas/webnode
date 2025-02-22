import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Önce admin kullanıcısının var olup olmadığını kontrol et
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: 'admin@webnode.com'
      }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin kullanıcısı zaten mevcut' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcısını oluştur
    const admin = await prisma.user.create({
      data: {
        email: 'admin@webnode.com',
        password: hashedPassword,
        name: 'Admin',
        username: 'admin',
        isAdmin: true,
      }
    });

    return NextResponse.json({
      message: 'Admin kullanıcısı başarıyla oluşturuldu',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        isAdmin: admin.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin kullanıcısı oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Admin kullanıcısı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 