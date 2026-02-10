import { create } from 'zustand'
import { api } from '../api/client'

interface AuthState {
  user: { id: number; login: string; role: string } | null
  loading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (login, password) => {
    const user = await api.login(login, password)
    set({ user })
  },
  logout: async () => {
    await api.logout()
    set({ user: null })
  },
  checkAuth: async () => {
    try {
      const user = await api.me()
      set({ user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
}))
