import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const photoId = params.id;
    const userId = session.user.id;

    // Fotoğrafın varlığını kontrol et
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { likes: true }
    });

    if (!photo) {
      return NextResponse.json(
        { message: 'Fotoğraf bulunamadı' },
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
      { message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 