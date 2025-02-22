import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Oturum açmanız gerekiyor' }), {
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar') as { email: string };
    } catch (error) {
      return new NextResponse(JSON.stringify({ error: 'Geçersiz token' }), {
        status: 401,
      });
    }

    const data = await request.json();
    const { name, username, bio, profileImage } = data;

    // Kullanıcı adının benzersiz olduğunu kontrol et
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username,
          NOT: {
            email: decodedToken.email,
          },
        },
      });

      if (existingUser) {
        return new NextResponse(JSON.stringify({ error: 'Bu kullanıcı adı zaten kullanılıyor' }), {
          status: 400,
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: decodedToken.email,
      },
      data: {
        name,
        username,
        bio,
        profileImage,
      },
    });

    // Yeni token oluştur
    const newToken = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
      },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      user: updatedUser,
      token: newToken
    });
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    return new NextResponse(JSON.stringify({ error: 'Sunucu hatası' }), {
      status: 500,
    });
  }
} 