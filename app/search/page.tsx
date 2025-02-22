'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
  _count: {
    posts: number;
    likes: number;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Arama yapılırken bir hata oluştu');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Arama hatası:', error);
        setError('Kullanıcılar aranırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [searchQuery, router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
      <Header />
      <main className="pt-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">
            "{searchQuery}" için arama sonuçları
          </h1>

          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white text-xl text-center">Aranıyor...</div>
          ) : users.length === 0 ? (
            <div className="text-white text-xl text-center">
              {searchQuery ? 'Kullanıcı bulunamadı' : 'Arama yapmak için bir şeyler yazın'}
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.name || 'Profil'}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl text-white">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                      <p className="text-gray-400">@{user.username}</p>
                      {user.bio && (
                        <p className="text-gray-300 mt-2 line-clamp-2">{user.bio}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span>{user._count.posts} gönderi</span>
                        <span>{user._count.likes} beğeni</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 