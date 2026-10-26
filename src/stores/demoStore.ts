import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DemoDataset, UserPreferences } from '@/types'
import { cloneInitialDataset } from '@/mock'

export const STORAGE_KEY = 'neurovault.demo.v1'
export const DATASET_VERSION = 1

type Collection = keyof DemoDataset

export interface DemoState {
  data: DemoDataset
  datasetVersion: number
  preferences: UserPreferences
  welcomeSeen: boolean
  tourStep: number | null
  lastResetAt: string | null
  // generic collection actions
  upsert: <K extends Collection>(collection: K, item: DemoDataset[K][number]) => void
  remove: (collection: Collection, id: string) => void
  patch: <K extends Collection>(collection: K, id: string, changes: Partial<DemoDataset[K][number]>) => void
  setPreferences: (p: Partial<UserPreferences>) => void
  setWelcomeSeen: (v: boolean) => void
  setTourStep: (v: number | null) => void
  resetDemo: () => void
}

export const defaultPreferences: UserPreferences = {
  theme: 'system',
  density: 'comfortable',
  dateFormat: 'dd MMM yyyy',
  defaultHospitalId: 'hosp-001',
  defaultCaseType: 'brain',
  notifications: { overdueFollowUps: true, upcomingSurgery: true, draftReports: true, dailyDigest: false },
  reducedMotion: false,
  showDemoBanner: true,
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      data: cloneInitialDataset(),
      datasetVersion: DATASET_VERSION,
      preferences: defaultPreferences,
      welcomeSeen: false,
      tourStep: null,
      lastResetAt: null,
      upsert: (collection, item) =>
        set((s) => {
          const list = s.data[collection] as { id: string }[]
          const idx = list.findIndex((x) => x.id === (item as { id: string }).id)
          const next = idx >= 0 ? list.map((x, i) => (i === idx ? item : x)) : [...list, item]
          return { data: { ...s.data, [collection]: next } }
        }),
      remove: (collection, id) =>
        set((s) => ({ data: { ...s.data, [collection]: (s.data[collection] as { id: string }[]).filter((x) => x.id !== id) } })),
      patch: (collection, id, changes) =>
        set((s) => ({
          data: {
            ...s.data,
            [collection]: (s.data[collection] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...changes } : x)),
          },
        })),
      setPreferences: (p) => set((s) => ({ preferences: { ...s.preferences, ...p } })),
      setWelcomeSeen: (v) => set({ welcomeSeen: v }),
      setTourStep: (v) => set({ tourStep: v }),
      resetDemo: () => set({ data: cloneInitialDataset(), datasetVersion: DATASET_VERSION, lastResetAt: new Date().toISOString() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: DATASET_VERSION,
      partialize: (s) => ({
        data: { ...s.data, documents: s.data.documents.map((d) => (d.dataUrl && d.dataUrl.length > 200_000 ? { ...d, dataUrl: undefined, description: `${d.description ?? ''} (preview not persisted — file too large for localStorage)`.trim() } : d)) },
        datasetVersion: s.datasetVersion,
        preferences: s.preferences,
        welcomeSeen: s.welcomeSeen,
        lastResetAt: s.lastResetAt,
      }),
      migrate: (persisted, version) => {
        if (version !== DATASET_VERSION) {
          return { ...(persisted as object), data: cloneInitialDataset(), datasetVersion: DATASET_VERSION }
        }
        return persisted as DemoState
      },
    },
  ),
)
