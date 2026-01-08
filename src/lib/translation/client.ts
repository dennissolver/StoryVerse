import { Translate } from '@google-cloud/translate/build/src/v2';

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
  projectId: process.env.GOOGLE_PROJECT_ID,
});

// Supported languages for StoryVerse
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', native: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', native: 'Français', flag: '🇫🇷' },
  de: { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  zh: { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', native: '한국어', flag: '🇰🇷' },
  ar: { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  ru: { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  nl: { name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  pl: { name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  tr: { name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  vi: { name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  th: { name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  id: { name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  ms: { name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
  fil: { name: 'Filipino', native: 'Filipino', flag: '🇵🇭' },
  he: { name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  uk: { name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  sv: { name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  da: { name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  no: { name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  fi: { name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  el: { name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  cs: { name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  ro: { name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  hu: { name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Translate a single text string
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<TranslationResult> {
  if (targetLanguage === 'en' && !sourceLanguage) {
    // No translation needed if target is English and source not specified
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: 'en',
      targetLanguage: 'en',
    };
  }

  try {
    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });

    return {
      originalText: text,
      translatedText: translation,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Translate multiple texts in batch (more efficient for stories)
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<string[]> {
  if (targetLanguage === 'en' && !sourceLanguage) {
    return texts;
  }

  try {
    const [translations] = await translate.translate(texts, {
      from: sourceLanguage,
      to: targetLanguage,
    });

    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}

/**
 * Translate an entire book's pages
 */
export async function translateBookPages(
  pages: Array<{ pageNumber: number; text: string }>,
  targetLanguage: LanguageCode
): Promise<Array<{ pageNumber: number; text: string; originalText: string }>> {
  const texts = pages.map(p => p.text);
  const translatedTexts = await translateBatch(texts, targetLanguage, 'en');

  return pages.map((page, index) => ({
    pageNumber: page.pageNumber,
    text: translatedTexts[index],
    originalText: page.text,
  }));
}

/**
 * Detect the language of a text
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const [detection] = await translate.detect(text);
    return Array.isArray(detection) ? detection[0].language : detection.language;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    ...info,
  }));
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

export { translate };
