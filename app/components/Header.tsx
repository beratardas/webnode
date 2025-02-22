'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  userId: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage?: string | null;
}

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      
      // Profil bilgilerini al
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
      setProfileData(data);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-gray-800 text-white py-4 px-6 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Sol Taraf - Logo ve Ana Navigasyon */}
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="text-2xl font-bold">
            WebNode
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/explore" className="hover:text-purple-400 transition-colors">
              Kullanıcıları Keşfet
            </Link>
            <Link href="/posts" className="hover:text-purple-400 transition-colors">
              Fotoğraflar
            </Link>
          </nav>
        </div>

        {/* Orta - Arama Çubuğu */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="Kullanıcı ara..."
              className="w-full px-4 py-2 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              🔍
            </button>
          </form>
        </div>

        {/* Sağ Taraf - Kullanıcı Menüsü */}
        <div className="flex items-center space-x-4">
          <Link href={`/profile/${user.username}`} className="flex items-center space-x-2 hover:text-purple-400">
            {profileData?.profileImage ? (
              <Image
                src={profileData.profileImage}
                alt={user.username || ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline">@{user.username}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  );
} 