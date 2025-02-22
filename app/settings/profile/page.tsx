'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Image from 'next/image';

interface Profile {
  name: string | null;
  username: string | null;
  bio: string | null;
  profileImage: string | null;
}

export default function ProfileSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    username: '',
    bio: '',
    profileImage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser(payload);
      if (payload.username) {
        fetchProfile(token, payload.username);
      }
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchProfile = async (token: string, username: string) => {
    try {
      const response = await fetch(`/api/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Profil yüklenemedi');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      setError('Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fotoğraf yüklenemedi');
      }

      const data = await response.json();
      setProfile(prev => ({ ...prev, profileImage: data.url }));
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      setError(error instanceof Error ? error.message : 'Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Profil güncellenemedi');
      }

      const data = await response.json();
      
      // Yeni token'ı kaydet
      localStorage.setItem('token', data.token);

      router.push(`/profile/${data.user.username}`);
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      setError(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white mb-8">Profil Ayarları</h1>

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Profil Fotoğrafı */}
              <div>
                <label className="block text-white mb-2">Profil Fotoğrafı</label>
                <div className="flex items-center space-x-4">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profil"
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-3xl text-white">
                      {profile.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-gray-300"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && (
                      <p className="text-gray-400 mt-2">Fotoğraf yükleniyor...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* İsim */}
              <div>
                <label htmlFor="name" className="block text-white mb-2">
                  İsim
                </label>
                <input
                  type="text"
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Kullanıcı Adı */}
              <div>
                <label htmlFor="username" className="block text-white mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  id="username"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Biyografi */}
              <div>
                <label htmlFor="bio" className="block text-white mb-2">
                  Biyografi
                </label>
                <textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Kaydet Butonu */}
              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 