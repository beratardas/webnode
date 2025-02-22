import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
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

    // Silinecek kullanıcıyı kontrol et
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { isAdmin: true }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Admin kullanıcısının silinmesini engelle
    if (userToDelete.isAdmin) {
      return NextResponse.json(
        { error: 'Admin kullanıcısı silinemez' },
        { status: 403 }
      );
    }

    // Kullanıcıyı sil
    await prisma.user.delete({
      where: { id: params.userId }
    });

    return NextResponse.json({
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 