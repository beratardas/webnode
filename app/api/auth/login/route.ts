import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        username: true,
        isAdmin: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '7d' }
    );

    // Kullanıcı bilgilerini döndür
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        isAdmin: user.isAdmin
      },
      token,
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 