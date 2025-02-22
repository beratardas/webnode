'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', data.token);
      
      // Ana sayfaya yönlendir
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">WebNode'a Hoş Geldiniz</h1>
          <p className="text-gray-400">
            Arkadaşlarınızla paylaşın, keşfedin ve eğlenin!
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Hesabınız yok mu?{' '}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 