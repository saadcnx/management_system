const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let refreshing: Promise<boolean> | null = null;

const refresh = () => {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

const request = async (method: string, endpoint: string, body?: any) => {
  const init: RequestInit = { method, credentials: 'include' };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  let res = await fetch(`${API_URL}${endpoint}`, init);
  const isAuthCall = endpoint === '/api/auth/login' || endpoint === '/api/auth/refresh';
  if (res.status === 401 && !isAuthCall) {
    if (await refresh()) {
      res = await fetch(`${API_URL}${endpoint}`, init);
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  return res.json();
};

export const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, body: any) => request('POST', endpoint, body),
  patch: (endpoint: string, body: any) => request('PATCH', endpoint, body),
};