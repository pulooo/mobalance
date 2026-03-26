import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  nome: string;
  ativo: boolean;
  is_admin: boolean;
  data_expiracao: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setTokens(access, refresh) {
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser(user) {
        set({ user });
      },

      logout() {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated() {
        return !!get().accessToken;
      },
    }),
    { name: "mobalance-auth" }
  )
);
