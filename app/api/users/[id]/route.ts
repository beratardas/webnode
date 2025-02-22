import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          include: {
            likes: true
          }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Hassas bilgileri çıkar
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata:', error);
    return NextResponse.json(
      { message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 