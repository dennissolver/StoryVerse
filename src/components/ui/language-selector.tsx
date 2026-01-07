'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'full' | 'compact' | 'icon';
  onChange?: (language: LanguageCode) => void;
}

export function LanguageSelector({ variant = 'full', onChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (value: string) => {
    const newLang = value as LanguageCode;
    setLanguage(newLang as any);
    onChange?.(newLang);
  };

  const currentLang = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];

  if (variant === 'icon') {
    return (
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger className="w-10 h-10 p-0 border-0 bg-transparent">
          <Globe className="h-5 w-5" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <SelectItem key={code} value={code}>
              <span className="mr-2">{info.flag}</span>
              {info.native}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger className="w-20">
          <SelectValue>
            <span>{currentLang?.flag} {language.toUpperCase()}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <SelectItem key={code} value={code}>
              <span className="mr-2">{info.flag}</span>
              {code.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={language} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue>
          <span className="mr-2">{currentLang?.flag}</span>
          {currentLang?.native}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
          <SelectItem key={code} value={code}>
            <div className="flex items-center">
              <span className="mr-2 text-lg">{info.flag}</span>
              <div>
                <div>{info.native}</div>
                <div className="text-xs text-muted-foreground">{info.name}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// For book reader - select language to read in
interface BookLanguageSelectorProps {
  bookId: string;
  availableLanguages: string[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  isTranslating?: boolean;
}

export function BookLanguageSelector({
  bookId,
  availableLanguages,
  currentLanguage,
  onLanguageChange,
  isTranslating,
}: BookLanguageSelectorProps) {
  return (
    <Select 
      value={currentLanguage} 
      onValueChange={onLanguageChange}
      disabled={isTranslating}
    >
      <SelectTrigger className="w-40">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue>
          {isTranslating ? 'Translating...' : (
            <>
              {SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES]?.flag}{' '}
              {SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES]?.native || currentLanguage}
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          <span className="mr-2">🇺🇸</span> English (Original)
        </SelectItem>
        {Object.entries(SUPPORTED_LANGUAGES)
          .filter(([code]) => code !== 'en')
          .map(([code, info]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center">
                <span className="mr-2">{info.flag}</span>
                <span>{info.native}</span>
                {availableLanguages.includes(code) && (
                  <span className="ml-2 text-xs text-green-500">✓</span>
                )}
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
