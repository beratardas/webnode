'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  createdAt: string;
  isAdmin: boolean;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  location: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
  likes: { id: string }[];
}

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setCurrentUser(payload);
      fetchUsers(token);
      fetchPosts(token);
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Kullanıcılar yüklenemedi');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      setError('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (token: string) => {
    try {
      const response = await fetch('/api/admin/posts', {
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
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Kullanıcı silinemedi');

      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      setError('Kullanıcı silinirken bir hata oluştu');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gönderi silinemedi');

      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Gönderi silme hatası:', error);
      setError('Gönderi silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Paneli</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 px-4 py-2 rounded-full text-white hover:bg-purple-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Menüsü */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-full ${
              activeTab === 'posts'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Gönderiler
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-6 py-3 text-left text-white">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-white">E-posta</th>
                    <th className="px-6 py-3 text-left text-white">Kayıt Tarihi</th>
                    <th className="px-6 py-3 text-left text-white">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {user.profileImage ? (
                            <Image
                              src={user.profileImage}
                              alt={user.name || ''}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-gray-400 text-sm">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{user.email}</td>
                      <td className="px-6 py-4 text-white">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-6 py-3 text-left text-white">Gönderi</th>
                    <th className="px-6 py-3 text-left text-white">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-white">Konum</th>
                    <th className="px-6 py-3 text-left text-white">Tarih</th>
                    <th className="px-6 py-3 text-left text-white">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-16 h-16">
                            <Image
                              src={post.imageUrl}
                              alt={post.caption || 'Gönderi'}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="text-white">
                            {post.caption && (
                              <p className="text-sm line-clamp-2">{post.caption}</p>
                            )}
                            <p className="text-gray-400 text-sm mt-1">
                              {post.likes.length} beğeni
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/profile/${post.user.username}`}
                          className="flex items-center space-x-2 text-white hover:text-purple-400"
                        >
                          {post.user.profileImage ? (
                            <Image
                              src={post.user.profileImage}
                              alt={post.user.name || ''}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                              {post.user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span>{post.user.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {post.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 