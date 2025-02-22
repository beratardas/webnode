'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
  likes: { id: string }[];
}

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  profileImage: string | null;
  posts: Post[];
}

interface ProfileClientProps {
  username: string;
}

export default function ProfileClient({ username }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
      fetchProfile(token);
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [username, router]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`/api/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Profil bulunamadı');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
        <Header />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-white text-xl">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
        <Header />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-white text-xl">Profil bulunamadı</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
      <Header />
      <main className="pt-20 container mx-auto px-4">
        {/* Profil Başlığı */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-8">
            {/* Profil Fotoğrafı */}
            <div className="relative w-32 h-32">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.name || 'Profil'}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center text-4xl text-white">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Profil Bilgileri */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-gray-400 mb-4">@{profile.username}</p>
              {profile.bio && (
                <p className="text-white mb-4">{profile.bio}</p>
              )}
              <div className="flex gap-4 text-white">
                <div>
                  <span className="font-bold">{profile.posts.length}</span> gönderi
                </div>
              </div>
            </div>

            {/* Profil Düzenleme Butonu (Kendi profili ise) */}
            {currentUser.username === profile.username && (
              <button
                onClick={() => router.push('/settings/profile')}
                className="bg-purple-600 px-6 py-2 rounded-full text-white hover:bg-purple-700 transition-colors"
              >
                Profili Düzenle
              </button>
            )}
          </div>
        </div>

        {/* Fotoğraf Galerisi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
            >
              <Image
                src={post.imageUrl}
                alt={post.caption || 'Fotoğraf'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                {post.caption && (
                  <p className="text-white text-sm line-clamp-3 mb-2">
                    {post.caption}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-white">❤️</span>
                    <span className="text-white text-sm">
                      {post.likes.length} beğeni
                    </span>
                  </div>
                  <span className="text-gray-300 text-xs">
                    {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Gradient Overlay - Her zaman görünür */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {profile.posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl text-white mb-2">Henüz Fotoğraf Yok</h3>
            {currentUser?.username === profile.username && (
              <p className="text-gray-400">
                İlk fotoğrafını paylaşmak için{' '}
                <Link href="/posts/new" className="text-purple-400 hover:text-purple-300">
                  buraya tıkla
                </Link>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 