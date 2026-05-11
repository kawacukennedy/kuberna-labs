const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function apiUrl(path: string): string {
  const base = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${base}${cleanPath}`;
}

export default apiUrl;
