import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "admin" | "member";
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const MOCK_USER: User = {
  id: "1",
  email: "carl@sheriff.studio",
  fullName: "Carl Sheriff",
  role: "admin",
};

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  isLoading: false,
  login: async (email: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 500));
    if (email) {
      set({ user: MOCK_USER, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },
  logout: () => {
    set({ user: null });
  },
}));
