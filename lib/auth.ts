import { validateSession } from './db';

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function isAuthenticated(request: Request) {
  const token = getAuthToken(request);
  if (!token) return null;
  return validateSession(token);
}
