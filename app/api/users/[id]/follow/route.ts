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

    const followerId = session.user.id;
    const followingId = params.id;

    // Kendini takip etmeyi engelle
    if (followerId === followingId) {
      return NextResponse.json(
        { message: 'Kendinizi takip edemezsiniz' },
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
      { message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 