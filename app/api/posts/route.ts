import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Fotoğraf yükleme
export async function POST(request: Request) {
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
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string };
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return new NextResponse(JSON.stringify({ error: 'Geçersiz token' }), {
        status: 401,
      });
    }

    const data = await request.json();
    console.log('Gelen veri:', data); // Debug log

    // Zorunlu alanları kontrol et
    if (!data.imageUrl) {
      console.error('Fotoğraf URL\'i eksik');
      return new NextResponse(JSON.stringify({ error: 'Fotoğraf URL\'i gerekli' }), {
        status: 400,
      });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: decodedToken.email },
    });

    if (!user) {
      console.error('Kullanıcı bulunamadı:', decodedToken.email);
      return new NextResponse(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), {
        status: 404,
      });
    }

    console.log('Kullanıcı bulundu:', user.id); // Debug log

    // Latitude ve longitude değerlerini number tipine dönüştür
    const numericLatitude = data.latitude ? parseFloat(data.latitude.toString()) : null;
    const numericLongitude = data.longitude ? parseFloat(data.longitude.toString()) : null;

    console.log('Dönüştürülen koordinatlar:', { numericLatitude, numericLongitude }); // Debug log

    // Post oluşturma
    interface PostData {
      imageUrl: string;
      caption: string | null;
      location: string | null;
      placeId: string | null;
      userId: string;
      latitude?: number | null;
      longitude?: number | null;
    }

    let postData: PostData | null = null;
    let post;

    try {
      postData = {
        imageUrl: data.imageUrl,
        caption: data.caption || null,
        location: data.location || null,
        placeId: data.placeId || null,
        userId: user.id,
      };

      console.log('Post verisi hazırlandı:', postData); // Debug log

      if (numericLatitude !== null) {
        postData.latitude = numericLatitude;
        console.log('Latitude eklendi:', numericLatitude); // Debug log
      }
      if (numericLongitude !== null) {
        postData.longitude = numericLongitude;
        console.log('Longitude eklendi:', numericLongitude); // Debug log
      }

      console.log('Prisma create işlemi başlatılıyor...'); // Debug log

      post = await prisma.post.create({
        data: {
          imageUrl: postData.imageUrl,
          caption: postData.caption,
          location: postData.location,
          placeId: postData.placeId,
          userId: postData.userId,
          latitude: postData.latitude === undefined ? null : postData.latitude,
          longitude: postData.longitude === undefined ? null : postData.longitude,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
          likes: true,
        },
      });

      console.log('Gönderi başarıyla oluşturuldu:', post); // Debug log
      return NextResponse.json(post);
    } catch (createError) {
      console.error('Gönderi oluşturma hatası (detaylı):', {
        error: createError,
        message: createError instanceof Error ? createError.message : 'Bilinmeyen hata',
        stack: createError instanceof Error ? createError.stack : undefined,
        postData: postData || 'Post verisi oluşturulamadı',
      });
      return new NextResponse(JSON.stringify({ 
        error: 'Gönderi oluşturulurken bir hata oluştu',
        details: createError instanceof Error ? createError.message : 'Bilinmeyen hata'
      }), {
        status: 500,
      });
    }
  } catch (error) {
    console.error('Genel hata:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Sunucu hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Tüm fotoğrafları getirme
export async function GET(request: Request) {
  try {
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Oturum açmanız gerekiyor' }), {
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return new NextResponse(JSON.stringify({ error: 'Geçersiz token' }), {
        status: 401,
      });
    }

    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },
        likes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Gönderileri getirme hatası:', error);
    return new NextResponse(JSON.stringify({ error: 'Sunucu hatası' }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
} 