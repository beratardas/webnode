'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900 flex items-center justify-center">
      <div className="text-white text-2xl">Yönlendiriliyor...</div>
    </div>
  );
}
