import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, name, username } = await request.json();

    // Gerekli alanların kontrolü
    if (!email || !password || !name || !username) {
      return new NextResponse(JSON.stringify({ error: 'Tüm alanlar gerekli' }), {
        status: 400,
      });
    }

    // E-posta kontrolü
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return new NextResponse(JSON.stringify({ error: 'Bu e-posta zaten kullanılıyor' }), {
        status: 400,
      });
    }

    // Kullanıcı adı kontrolü
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return new NextResponse(JSON.stringify({ error: 'Bu kullanıcı adı zaten kullanılıyor' }), {
        status: 400,
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    return new NextResponse(JSON.stringify({ error: 'Sunucu hatası' }), {
      status: 500,
    });
  }
} 