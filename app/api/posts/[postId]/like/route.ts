import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { email: string };
    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      include: { likes: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Gönderi bulunamadı' },
        { status: 404 }
      );
    }

    const existingLike = post.likes.find(like => like.userId === user.id);

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Beğeni ekle
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Beğeni işlemi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 