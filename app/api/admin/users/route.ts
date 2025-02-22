import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { email: string; isAdmin: boolean };
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Admin kontrolü
    if (!decodedToken.isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Tüm kullanıcıları getir
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        profileImage: true,
        createdAt: true,
        isAdmin: true,
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Kullanıcılar listelenirken hata:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 