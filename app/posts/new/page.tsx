'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import { useLoadScript, StandaloneSearchBox, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ['places'];

interface Place {
  name: string;
  place_id: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

export default function NewPost() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'tr',
    region: 'TR'
  });

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0] as Place;
        setLocation(place.name);
        setPlaceId(place.place_id);
        setLatitude(place.geometry.location.lat());
        setLongitude(place.geometry.location.lng());
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Fotoğraf yüklenemedi');
      }

      const data = await response.json();
      setImage(data.url);
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      setError('Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Lütfen bir fotoğraf seçin');
      return;
    }

    setUploading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      console.log('Gönderilen veriler:', {
        imageUrl: image,
        caption,
        location,
        placeId,
        latitude,
        longitude,
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: image,
          caption,
          location,
          placeId,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        }),
      });

      const responseData = await response.json();
      console.log('Sunucu yanıtı:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error + (responseData.details ? `\nDetaylar: ${responseData.details}` : ''));
      }

      router.push('/posts');
    } catch (error) {
      console.error('Gönderi paylaşma hatası (detaylı):', error);
      setError(error instanceof Error ? error.message : 'Gönderi paylaşılırken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
        <Header />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-white text-xl">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
      <Header />
      <main className="pt-20 container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Yeni Gönderi</h1>

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Fotoğraf Yükleme */}
              <div>
                <label className="block text-white mb-2">Fotoğraf</label>
                <div className="space-y-4">
                  {image ? (
                    <div className="relative aspect-square w-full max-w-xl mx-auto">
                      <Image
                        src={image}
                        alt="Yüklenecek fotoğraf"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-gray-300 hover:text-white"
                      >
                        Fotoğraf seçmek için tıklayın veya sürükleyin
                      </label>
                    </div>
                  )}
                  {uploading && (
                    <p className="text-gray-400 text-center">Fotoğraf yükleniyor...</p>
                  )}
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label htmlFor="caption" className="block text-white mb-2">
                  Açıklama
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Gönderiniz hakkında bir şeyler yazın..."
                />
              </div>

              {/* Konum */}
              <div>
                <label htmlFor="location" className="block text-white mb-2">
                  Konum
                </label>
                <StandaloneSearchBox
                  onLoad={ref => setSearchBox(ref)}
                  onPlacesChanged={onPlacesChanged}
                >
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Konum ara..."
                  />
                </StandaloneSearchBox>
              </div>

              {/* Paylaş Butonu */}
              <button
                type="submit"
                disabled={uploading || !image}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Paylaşılıyor...' : 'Paylaş'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 