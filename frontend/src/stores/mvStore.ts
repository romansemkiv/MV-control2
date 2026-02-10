import { create } from 'zustand'
import { api } from '../api/client'

interface MVState {
  multiviewers: any[]
  sources: any[]
  routing: any[]
  currentMV: any | null
  selectedWindow: number | null
  loadMultiviewers: () => Promise<void>
  loadSources: () => Promise<void>
  loadRouting: () => Promise<void>
  selectMV: (id: number) => Promise<void>
  selectWindow: (index: number | null) => void
}

export const useMVStore = create<MVState>((set) => ({
  multiviewers: [],
  sources: [],
  routing: [],
  currentMV: null,
  selectedWindow: null,
  loadMultiviewers: async () => {
    const mvs = await api.getMultiviewers()
    set({ multiviewers: mvs })
  },
  loadSources: async () => {
    const sources = await api.getSources()
    set({ sources })
  },
  loadRouting: async () => {
    const routing = await api.getRouting()
    set({ routing })
  },
  selectMV: async (id) => {
    const mv = await api.getMultiviewer(id)
    set({ currentMV: mv, selectedWindow: null })
  },
  selectWindow: (index) => set({ selectedWindow: index }),
}))
