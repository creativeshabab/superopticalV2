import { create } from 'zustand';
import { SafeUser, TenantContext, StoreContext } from '@super-optical/types';

interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantContext: TenantContext | null;
  storeContext: StoreContext | null;
  availableTenants: TenantContext[];
  availableStores: StoreContext[];
  permissions: string[];
  isAuthenticated: boolean;

  setAuth: (payload: {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    tenantContext?: TenantContext | null;
    storeContext?: StoreContext | null;
    availableTenants?: TenantContext[];
    availableStores?: StoreContext[];
    permissions?: string[];
  }) => void;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setTenant: (tenant: TenantContext) => void;
  setStore: (store: StoreContext) => void;
  logout: () => void;
}

const STORAGE_KEY = 'super_optical_auth';

// Load initial state from local storage if valid
const loadSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};

const saved = loadSavedState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: saved?.user || null,
  accessToken: saved?.accessToken || null,
  refreshToken: saved?.refreshToken || null,
  tenantContext: saved?.tenantContext || null,
  storeContext: saved?.storeContext || null,
  availableTenants: saved?.availableTenants || [],
  availableStores: saved?.availableStores || [],
  permissions: saved?.permissions || [],
  isAuthenticated: !!(saved?.accessToken && saved?.user),

  setAuth: (payload) => {
    const newState = {
      user: payload.user,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      tenantContext: payload.tenantContext || null,
      storeContext: payload.storeContext || null,
      availableTenants: payload.availableTenants || (payload.tenantContext ? [payload.tenantContext] : []),
      availableStores: payload.availableStores || (payload.storeContext ? [payload.storeContext] : []),
      permissions: payload.permissions || [],
      isAuthenticated: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    set(newState);
  },

  setTokens: (accessToken, refreshToken) => {
    const current = get();
    const updated = {
      ...current,
      accessToken,
      refreshToken,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ accessToken, refreshToken });
  },

  setTenant: (tenant) => {
    const current = get();
    const updated = {
      ...current,
      tenantContext: tenant,
      storeContext: null, // Reset store when switching tenant
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ tenantContext: tenant, storeContext: null });
  },

  setStore: (store) => {
    const current = get();
    const updated = {
      ...current,
      storeContext: store,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ storeContext: store });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantContext: null,
      storeContext: null,
      availableTenants: [],
      availableStores: [],
      permissions: [],
      isAuthenticated: false,
    });
  },
}));
