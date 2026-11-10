/**
 * Shared API URL builder.
 *
 * In production, set VITE_API_BASE_URL to the public Railway backend origin,
 * for example: https://your-service.up.railway.app
 * Locally, leave it unset and Vite's /api proxy handles requests.
 */
const configuredApiOrigin = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const API_V1_BASE = '/api/v1';

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiOrigin}${normalizedPath}`;
}
