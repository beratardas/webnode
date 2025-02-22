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

    const photoId = params.id;
    const userId = decodedToken.userId;

    // Fotoğrafın varlığını kontrol et
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { likes: true }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Fotoğraf bulunamadı' },
        { status: 404 }
      );
    }

    // Beğeni durumunu kontrol et
    const existingLike = await prisma.like.findUnique({
      where: {
        photoId_userId: {
          photoId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.like.delete({
        where: {
          photoId_userId: {
            photoId,
            userId,
          },
        },
      });

      return NextResponse.json({ message: 'Beğeni kaldırıldı' });
    } else {
      // Beğeni ekle
      await prisma.like.create({
        data: {
          photoId,
          userId,
        },
      });

      return NextResponse.json({ message: 'Fotoğraf beğenildi' });
    }
  } catch (error) {
    console.error('Beğeni işlemi sırasında hata:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 