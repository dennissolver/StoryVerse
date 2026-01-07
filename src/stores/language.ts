import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UI_TRANSLATIONS, type UILanguage, type UITranslations } from '@/lib/translation';

interface LanguageState {
  language: UILanguage;
  translations: UITranslations;
  setLanguage: (lang: UILanguage) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      translations: UI_TRANSLATIONS.en,

      setLanguage: (lang: UILanguage) => {
        set({
          language: lang,
          translations: UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en,
        });
      },

      // Helper function to get nested translation by dot notation
      // e.g., t('nav.home') returns 'Home'
      t: (key: string) => {
        const { translations } = get();
        const keys = key.split('.');
        let value: any = translations;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            // Return key if translation not found
            console.warn(`Translation not found: ${key}`);
            return key;
          }
        }
        
        return typeof value === 'string' ? value : key;
      },
    }),
    {
      name: 'storyverse-language',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        // Restore translations on rehydration
        if (state) {
          state.translations = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS.en;
        }
      },
    }
  )
);

// Hook for easy access to translation function
export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguageStore();
  return { t, language, setLanguage };
};
