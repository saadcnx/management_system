"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUser() {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me'),
    staleTime: 5 * 60 * 1000,
  });
  return data?.user;
}