import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
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
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya gerekli' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Geçerli bir resim dosyası gerekli' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' },
        { status: 400 }
      );
    }

    try {
      // Dosyayı buffer'a çevir
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Base64'e çevir
      const base64String = buffer.toString('base64');
      const base64File = `data:${file.type};base64,${base64String}`;

      // Cloudinary'ye yükle
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload(base64File, {
          folder: 'webnode',
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        }, (error, result) => {
          if (error) {
            console.error('Cloudinary yükleme hatası:', error);
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      return NextResponse.json({
        url: (result as any).secure_url
      });
    } catch (error) {
      console.error('Cloudinary yükleme hatası:', error);
      return NextResponse.json(
        { error: 'Fotoğraf yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fotoğraf yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 