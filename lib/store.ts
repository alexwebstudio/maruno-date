import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, Project } from '@/types'
import { translations } from '@/lib/i18n'

interface AppStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  isDirty: boolean
  setIsDirty: (v: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      language: 'ru',
      setLanguage: (lang) => set({ language: lang }),
      t: (key: string) => {
        const lang = get().language
        const dict = translations[lang] || translations['ru']
        return (dict as Record<string, string>)[key] || key
      },
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
      isEditing: false,
      setIsEditing: (v) => set({ isEditing: v }),
      isDirty: false,
      setIsDirty: (v) => set({ isDirty: v }),
    }),
    {
      name: 'maruno-date-store',
      partialize: (state) => ({ language: state.language }),
    }
  )
)
