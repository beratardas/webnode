import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
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

    // Gönderiyi sil
    await prisma.post.delete({
      where: {
        id: params.postId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gönderi silme hatası:', error);
    return NextResponse.json(
      { error: 'Gönderi silinirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 