import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    const followerId = decodedToken.userId;
    const followingId = params.id;

    // Kendini takip etmeyi engelle
    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Kendinizi takip edemezsiniz' },
        { status: 400 }
      );
    }

    // Takip durumunu kontrol et
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Takipten çık
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return NextResponse.json({ message: 'Takipten çıkıldı' });
    } else {
      // Takip et
      await prisma.follows.create({
        data: {
          followerId,
          followingId,
        },
      });

      return NextResponse.json({ message: 'Takip edildi' });
    }
  } catch (error) {
    console.error('Takip işlemi sırasında hata:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 