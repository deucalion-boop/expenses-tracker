import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('expense-tracker-token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('expense-tracker-token', token)
    } else {
      localStorage.removeItem('expense-tracker-token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('expense-tracker-token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
