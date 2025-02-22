'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (username: string) => {
    const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
    const validChars = /^[a-zA-Z0-9_]+$/;
    
    if (turkishChars.test(username)) {
      return 'Kullanıcı adında Türkçe karakter kullanılamaz';
    }
    
    if (!validChars.test(username)) {
      return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }
    
    if (username.length < 3 || username.length > 20) {
      return 'Kullanıcı adı 3-20 karakter arasında olmalıdır';
    }
    
    return null;
  };

  const validateEmail = (email: string) => {
    // Temel e-posta format kontrolü
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Geçerli bir e-posta adresi giriniz';
    }

    // Yaygın geçersiz domainleri kontrol et
    const invalidDomains = [
      'tempmail.com', 'temp-mail.org', 'throwawaymail.com',
      'yopmail.com', 'mailinator.com', '10minutemail.com',
      'guerrillamail.com', 'sharklasers.com', 'grr.la',
      'fakeinbox.com', 'safemail.com', 'tempmail.net'
    ];

    const domain = email.split('@')[1].toLowerCase();
    if (invalidDomains.includes(domain)) {
      return 'Geçici e-posta adresleri kabul edilmemektedir';
    }

    // Yaygın e-posta servislerini kontrol et
    const commonDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
      'icloud.com', 'yandex.com', 'protonmail.com', 'aol.com',
      'msn.com', 'live.com', 'mail.com', 'zoho.com'
    ];

    if (!commonDomains.includes(domain)) {
      return 'Lütfen yaygın bir e-posta servisi kullanın';
    }

    return null;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }
    
    if (!/[A-Z]/.test(password)) {
      return 'Şifre en az bir büyük harf içermelidir';
    }
    
    if (!/[a-z]/.test(password)) {
      return 'Şifre en az bir küçük harf içermelidir';
    }
    
    if (!/[0-9]/.test(password)) {
      return 'Şifre en az bir rakam içermelidir';
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Şifre en az bir özel karakter içermelidir';
    }
    
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Kullanıcı adı validasyonu
    if (name === 'username') {
      const usernameError = validateUsername(value);
      if (usernameError) {
        setError(usernameError);
        return;
      }
    }

    // E-posta validasyonu
    if (name === 'email') {
      const emailError = validateEmail(value);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    // Şifre validasyonu
    if (name === 'password') {
      const passwordError = validatePassword(value);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Son bir kez validasyonları kontrol et
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      setError(usernameError);
      setLoading(false);
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt başarısız');
      }

      router.push('/auth/signin');
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
          <h1 className="text-3xl font-bold text-white mb-2">WebNode'a Katılın</h1>
          <p className="text-gray-400">
            Hemen hesap oluşturun ve paylaşmaya başlayın!
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Ad Soyad
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
              placeholder="Sadece İngilizce karakterler, rakamlar ve alt çizgi (_) kullanabilirsiniz"
            />
            <p className="mt-1 text-sm text-gray-400">
              3-20 karakter arası, Türkçe karakter kullanmayın
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
              placeholder="En az 8 karakter"
            />
            <p className="mt-1 text-sm text-gray-400">
              En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Zaten hesabınız var mı?{' '}
            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 