import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Oturum açmanız gerekiyor' }), {
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar');
    } catch (error) {
      return new NextResponse(JSON.stringify({ error: 'Geçersiz token' }), {
        status: 401,
      });
    }

    const profile = await prisma.user.findUnique({
      where: {
        username: params.username,
      },
      include: {
        posts: {
          include: {
            likes: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: 'Profil bulunamadı' }), {
        status: 404,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profil yüklenirken hata:', error);
    return new NextResponse(JSON.stringify({ error: 'Sunucu hatası' }), {
      status: 500,
    });
  }
} 