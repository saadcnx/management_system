"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/login', { email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">Login to LMS</h1>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
        </div>
        <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">Login</button>
      </form>
    </div>
  );
}