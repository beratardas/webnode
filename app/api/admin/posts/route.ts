import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string; isAdmin: boolean };
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Admin kontrolü
    if (!decodedToken.isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    // Tüm gönderileri getir
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },
        likes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Gönderileri getirme hatası:', error);
    return NextResponse.json(
      { error: 'Gönderiler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 