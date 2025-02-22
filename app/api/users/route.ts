import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Oturum açmanız gerekiyor' }), {
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar') as { email: string };
    } catch (error) {
      return new NextResponse(JSON.stringify({ error: 'Geçersiz token' }), {
        status: 401,
      });
    }

    const users = await prisma.user.findMany({
      where: {
        NOT: {
          email: decodedToken.email,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        profileImage: true,
        bio: true,
        _count: {
          select: {
            posts: true,
            likes: true
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Kullanıcılar yüklenirken hata:', error);
    return new NextResponse(JSON.stringify({ error: 'Sunucu hatası' }), {
      status: 500,
    });
  }
} 