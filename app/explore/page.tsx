'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
}

export default function ExplorePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
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
      fetchUsers(token);
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Kullanıcılar yüklenemedi');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
      <Header />
      <main className="pt-20 container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Kullanıcıları Keşfet</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
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
                <div>
                  <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                  <p className="text-gray-400">@{user.username}</p>
                  {user.bio && (
                    <p className="text-gray-300 mt-2 line-clamp-2">{user.bio}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
} 