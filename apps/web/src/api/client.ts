import { useAuthStore } from '../store/authStore';

const API_BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { accessToken, refreshToken, tenantContext, storeContext, setTokens, logout } =
    useAuthStore.getState();

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (tenantContext?.id) {
    headers['X-Tenant-ID'] = tenantContext.id;
  }

  if (storeContext?.id) {
    headers['X-Store-ID'] = storeContext.id;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401 && !options.skipAuth && refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          logout();
          window.location.href = '/login';
          throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please log in again.');
        }

        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.data.accessToken;
        const newRefreshToken = refreshData.data.refreshToken;

        setTokens(newAccessToken, newRefreshToken);
        isRefreshing = false;
        onRefreshed(newAccessToken);

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new ApiError(
            retryRes.status,
            retryData?.error?.code || 'API_ERROR',
            retryData?.error?.message || 'Request failed',
            retryData?.error?.details
          );
        }
        return retryData.data !== undefined ? retryData.data : retryData;
      } catch (err) {
        isRefreshing = false;
        logout();
        throw err;
      }
    } else {
      // Wait for existing refresh to resolve
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber(async (newToken: string) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryRes = await fetch(url, { ...options, headers });
            const retryData = await retryRes.json();
            if (!retryRes.ok) {
              reject(
                new ApiError(
                  retryRes.status,
                  retryData?.error?.code || 'API_ERROR',
                  retryData?.error?.message || 'Request failed'
                )
              );
            } else {
              resolve(retryData.data !== undefined ? retryData.data : retryData);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.code || 'API_ERROR',
      data?.error?.message || 'An error occurred during API request',
      data?.error?.details
    );
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
