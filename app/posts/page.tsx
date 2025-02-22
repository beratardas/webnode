'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  location: string | null;
  createdAt: string;
  user: User;
  likes: { id: string }[];
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser(payload);
      fetchPosts(token);
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchPosts = async (token: string) => {
    try {
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Gönderiler yüklenemedi');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
      setError('Gönderiler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Beğeni işlemi başarısız');

      // Beğeni durumunu güncelle
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.some(like => like.id === currentUser.userId);
          return {
            ...post,
            likes: hasLiked
              ? post.likes.filter(like => like.id !== currentUser.userId)
              : [...post.likes, { id: currentUser.userId }]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Beğeni hatası:', error);
      setError('Beğeni işlemi sırasında bir hata oluştu');
    }
  };

  // Belirli bir konumdaki son 3 gönderiyi filtreleme fonksiyonu
  const getLastThreePostsByLocation = (location: string) => {
    return posts
      .filter(post => post.location === location)
      .slice(0, 3);
  };

  // Benzersiz konumları alma fonksiyonu
  const getUniqueLocations = () => {
    const locations = posts
      .filter(post => post.location)
      .map(post => post.location as string);
    return Array.from(new Set(locations));
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Gönderiler</h1>
            <Link
              href="/posts/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              Yeni Gönderi
            </Link>
          </div>

          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Konumlar Listesi */}
            {getUniqueLocations().map(location => (
              <div key={location} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">📍 {location}</h2>
                    <button
                      onClick={() => setExpandedLocation(expandedLocation === location ? null : location)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
                    >
                      {expandedLocation === location ? 'Gizle' : 'Gönderileri Göster'}
                    </button>
                  </div>

                  {/* Genişletilmiş Gönderi Listesi */}
                  {expandedLocation === location && (
                    <div className="mt-4 space-y-4">
                      {getLastThreePostsByLocation(location).map(post => (
                        <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center space-x-4 mb-4">
                            <Link href={`/profile/${post.user.username}`}>
                              {post.user.profileImage ? (
                                <Image
                                  src={post.user.profileImage}
                                  alt={post.user.name || ''}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                                  {post.user.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </Link>
                            <div>
                              <Link
                                href={`/profile/${post.user.username}`}
                                className="font-semibold text-white hover:underline"
                              >
                                {post.user.name}
                              </Link>
                              <p className="text-gray-400 text-sm">
                                {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          <div className="relative aspect-square w-full mb-4">
                            <Image
                              src={post.imageUrl}
                              alt={post.caption || 'Gönderi'}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          {post.caption && (
                            <p className="text-white mb-2">{post.caption}</p>
                          )}
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleLike(post.id)}
                              className="text-2xl"
                            >
                              {post.likes.some(like => like.id === currentUser?.userId)
                                ? '❤️'
                                : '🤍'}
                            </button>
                            <span className="text-white">
                              {post.likes.length} beğeni
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Normal Gönderi Listesi */}
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Gönderi Başlığı */}
                <div className="p-4 flex items-center space-x-4">
                  <Link href={`/profile/${post.user.username}`}>
                    {post.user.profileImage ? (
                      <Image
                        src={post.user.profileImage}
                        alt={post.user.name || ''}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                        {post.user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${post.user.username}`}
                      className="font-semibold text-white hover:underline"
                    >
                      {post.user.name}
                    </Link>
                    <p className="text-gray-400 text-sm">@{post.user.username}</p>
                  </div>
                </div>

                {/* Gönderi Fotoğrafı */}
                <div className="relative aspect-square">
                  <Image
                    src={post.imageUrl}
                    alt={post.caption || 'Gönderi'}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Gönderi Altı */}
                <div className="p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="text-2xl"
                    >
                      {post.likes.some(like => like.id === currentUser?.userId)
                        ? '❤️'
                        : '🤍'}
                    </button>
                    <span className="text-white">
                      {post.likes.length} beğeni
                    </span>
                  </div>
                  {post.caption && (
                    <p className="text-white">
                      <Link
                        href={`/profile/${post.user.username}`}
                        className="font-semibold hover:underline mr-2"
                      >
                        {post.user.name}
                      </Link>
                      {post.caption}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 