import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    const postId = params.id;
    const userId = decodedToken.userId;

    // Gönderinin varlığını kontrol et
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likes: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Gönderi bulunamadı' },
        { status: 404 }
      );
    }

    // Beğeni durumunu kontrol et
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return NextResponse.json({ message: 'Beğeni kaldırıldı' });
    } else {
      // Beğeni ekle
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      return NextResponse.json({ message: 'Gönderi beğenildi' });
    }
  } catch (error) {
    console.error('Beğeni işlemi sırasında hata:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 